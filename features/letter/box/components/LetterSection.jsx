import { memo, useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import Tabs from '../../../../shared/components/navigation/tabs/Tabs';
import { gap, padding } from '../../../../shared/styles/token';

import Card from '../../components/Card';
import useLetterBox from '../hooks/useLetterBox';

const LETTER_FILTER = {
  UNREAD: 'unread',
  ALL: 'all',
  RECEIVED: 'received',
  SENT: 'sent',
  SELF: 'self',
};

const LETTER_FILTERS = [
  { key: LETTER_FILTER.UNREAD, label: '안 읽음' },
  { key: LETTER_FILTER.ALL, label: '전체 편지' },
  { key: LETTER_FILTER.RECEIVED, label: '받은 편지' },
  { key: LETTER_FILTER.SENT, label: '보낸 편지' },
  { key: LETTER_FILTER.SELF, label: '나에게 쓴 편지' },
];

/* Tabs 는 인덱스 기반이라 key 와 매핑한다 */
const LETTER_FILTER_LABELS = LETTER_FILTERS.map(filter => filter.label);

// 스크롤이 끝에서 화면 높이의 이 비율 이내로 오면 다음 페이지를 불러온다
const END_REACHED_THRESHOLD = 0.4;

// bottomInset: 목록 하단이 FAB에 가려지지 않도록 확보할 여백
// onPressLetter: 편지 카드를 누르면 letter 객체와 함께 호출
const LetterSection = ({ userId, bottomInset = 0, onPressLetter }) => {
  const [activeFilter, setActiveFilter] = useState(LETTER_FILTER.ALL);
  const activeFilterIndex = LETTER_FILTERS.findIndex(filter => filter.key === activeFilter);

  // TODO: letters가 비어 있을 때 Empty 뷰 추가
  const { letters, isFetchingNextPage, hasNextPage, fetchNextPage } = useLetterBox({
    userId,
    filter: activeFilter,
  });

  const handleChangeFilter = useCallback(index => {
    setActiveFilter(LETTER_FILTERS[index].key);
  }, []);

  const handleScroll = useCallback(
    ({ nativeEvent }) => {
      const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
      const distanceFromEnd = contentSize.height - (contentOffset.y + layoutMeasurement.height);

      if (distanceFromEnd > layoutMeasurement.height * END_REACHED_THRESHOLD) return;
      if (!hasNextPage || isFetchingNextPage) return;
      void fetchNextPage();
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  return (
    <View style={styles.container}>
      <Tabs
        tabs={LETTER_FILTER_LABELS}
        activeIndex={activeFilterIndex}
        onChange={handleChangeFilter}
      />

      {/* TODO: 안 읽음 탭 레이아웃 */}
      {activeFilter !== LETTER_FILTER.UNREAD && (
        <ScrollView
          contentContainerStyle={{ paddingBottom: bottomInset }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.letterContainer}>
            {letters.map(letter => (
              <Card key={letter.letterId} letter={letter} onPress={() => onPressLetter?.(letter)} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  letterContainer: {
    display: 'flex',
    width: '100%',
    paddingHorizontal: padding.M,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.M,
  },
});

export default memo(LetterSection);
