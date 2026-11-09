import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { getStampHeight } from '../../../../shared/components/content/Stamp';
import PullToRefresh from '../../../../shared/components/layout/PullToRefresh';
import usePullRefresh from '../../../../shared/hooks/usePullRefresh';
import { gap, padding } from '../../../../shared/styles/token';
import { chunk } from '../../../../shared/utils/arrayUtils';

import useStampBox from './hooks/useStampBox';
import StampBoxItem from './components/StampBoxItem';

const STAMP_COLUMNS = 3;
// 화면 밖 위아래로 미리 그려 둘 범위 (화면 높이 단위). 작을수록 처음 그리는 양이 적다
const STAMP_LIST_WINDOW_SIZE = 5;
// 화면에 보이는 줄을 그린 뒤 나머지를 한 번에 몇 줄씩 그릴지
const STAMP_ROWS_PER_BATCH = 2;

// 한 줄(우표 3개)이 목록의 한 항목이다
const stampRowKeyExtractor = row => row[0].stampCode;
const renderStampRowSeparator = () => <View style={styles.rowSeparator} />;

// bottomInset: 목록 하단이 FAB에 가려지지 않도록 확보할 여백
// onPressStamp: 받은 우표를 누르면 stampCode 와 함께 호출
const StampSection = ({ userId, bottomInset = 0, onPressStamp }) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // 우표는 처음부터 전부 보여주고, 받은 적 없는 우표는 StampBoxItem 에서 회색 처리한다
  const { stamps, refetchStamps } = useStampBox({ userId });

  // 위로 당기면 받은 우표 개수를 다시 불러온다
  const { isPullRefreshing, handleRefresh } = usePullRefresh({
    refetch: refetchStamps,
    errorMessage: '우표함 새로고침에 실패했습니다.',
  });

  // 한 줄에 3개: 화면 폭에서 좌우 padding 과 우표 사이 gap 을 뺀 나머지를 나눈다
  const stampWidth = (windowWidth - padding.L * 2 - gap.M * (STAMP_COLUMNS - 1)) / STAMP_COLUMNS;

  // 처음에는 화면에 보이는 줄만 그리고, 아래 줄은 그 뒤에 / 스크롤하면서 그린다
  const visibleRowCount = Math.ceil(windowHeight / (getStampHeight(stampWidth) + gap.M));

  const stampRows = useMemo(() => chunk(stamps, STAMP_COLUMNS), [stamps]);

  const renderStampRow = useCallback(
    ({ item: row }) => (
      <View style={styles.stampRow}>
        {row.map(stamp => (
          <StampBoxItem
            key={stamp.stampCode}
            stampCode={stamp.stampCode}
            count={stamp.count}
            width={stampWidth}
            onPress={onPressStamp}
          />
        ))}
      </View>
    ),
    [onPressStamp, stampWidth],
  );

  return (
    <PullToRefresh refreshing={isPullRefreshing} onRefresh={handleRefresh}>
      <Animated.FlatList
        data={stampRows}
        keyExtractor={stampRowKeyExtractor}
        renderItem={renderStampRow}
        ItemSeparatorComponent={renderStampRowSeparator}
        contentContainerStyle={[styles.stampContainer, { paddingBottom: padding.L + bottomInset }]}
        initialNumToRender={visibleRowCount}
        maxToRenderPerBatch={STAMP_ROWS_PER_BATCH}
        windowSize={STAMP_LIST_WINDOW_SIZE}
        showsVerticalScrollIndicator={false}
      />
    </PullToRefresh>
  );
};

const styles = StyleSheet.create({
  stampContainer: {
    width: '100%',
    padding: padding.L,
  },
  // 줄 사이 간격 (FlatList 는 항목 사이에 gap 대신 구분선으로 띄운다)
  rowSeparator: {
    height: gap.M,
  },
  stampRow: {
    display: 'flex',
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.M,
  },
});

export default memo(StampSection);
