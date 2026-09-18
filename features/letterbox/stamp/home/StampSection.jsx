import { memo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import usePullRefresh from '../../../../shared/hooks/usePullRefresh';
import { gap, padding } from '../../../../shared/styles/token';
import { chunk } from '../../../../shared/utils/arrayUtils';

import useStampBox from './hooks/useStampBox';
import StampBoxItem from './components/StampBoxItem';

const STAMP_COLUMNS = 3;

// bottomInset: 목록 하단이 FAB에 가려지지 않도록 확보할 여백
// onPressStamp: 받은 우표를 누르면 stampCode 와 함께 호출
const StampSection = ({ userId, bottomInset = 0, onPressStamp }) => {
  const { width: windowWidth } = useWindowDimensions();

  // 우표는 처음부터 전부 보여주고, 받은 적 없는 우표는 StampBoxItem 에서 회색 처리한다
  const { stamps, refetchStamps } = useStampBox({ userId });

  // 위로 당기면 받은 우표 개수를 다시 불러온다
  const { isPullRefreshing, handleRefresh } = usePullRefresh({
    refetch: refetchStamps,
    errorMessage: '우표함 새로고침에 실패했습니다.',
  });

  // 한 줄에 3개: 화면 폭에서 좌우 padding 과 우표 사이 gap 을 뺀 나머지를 나눈다
  const stampWidth = (windowWidth - padding.L * 2 - gap.M * (STAMP_COLUMNS - 1)) / STAMP_COLUMNS;

  return (
    <ScrollView
      contentContainerStyle={[styles.stampContainer, { paddingBottom: padding.L + bottomInset }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handleRefresh} />}
    >
      {chunk(stamps, STAMP_COLUMNS).map((row, rowIndex) => (
        <View key={`stamp-row-${rowIndex}`} style={styles.stampRow}>
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
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  stampContainer: {
    display: 'flex',
    width: '100%',
    padding: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.M,
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
