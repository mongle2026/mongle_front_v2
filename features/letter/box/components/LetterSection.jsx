import { memo, useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import Empty from '../../../../shared/components/content/Empty';
import Tabs from '../../../../shared/components/navigation/tabs/Tabs';
import { gap, padding } from '../../../../shared/styles/token';

import Card from '../../components/Card';
import useLetterBox from '../hooks/useLetterBox';
import UnreadLetterStack from './UnreadLetterStack';

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

const EMPTY_UNREAD_TITLE = '읽지 않은 편지가 없어요.';
const EMPTY_UNREAD_BODY = '도착한 편지를 모두 확인했어요.';
const EMPTY_LETTER_TITLE = '아직 주고받은 편지가 없어요.';
const EMPTY_LETTER_BODY = '전송 예정인 편지는 잘 배송되고 있어요.';

// bottomInset: 목록 하단이 FAB에 가려지지 않도록 확보할 여백
// onPressLetter: 편지 카드를 누르면 letter 객체와 함께 호출
const LetterSection = ({ userId, bottomInset = 0, onPressLetter }) => {
  const [activeFilter, setActiveFilter] = useState(LETTER_FILTER.ALL);
  const activeFilterIndex = LETTER_FILTERS.findIndex(filter => filter.key === activeFilter);

  const { letters, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useLetterBox({
    userId,
    filter: activeFilter,
  });

  const isUnread = activeFilter === LETTER_FILTER.UNREAD;

  // 상세에서 읽음 처리된 편지는 안 읽음 목록에서 바로 뺀다 (useLetterDetail 이 캐시의 isRead 를 갱신)
  const unreadLetters = useMemo(() => letters.filter(letter => !letter.isRead), [letters]);
  const visibleLetters = isUnread ? unreadLetters : letters;
  const isEmpty = !isLoading && visibleLetters.length === 0;

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

      {isEmpty && (
        <Empty
          type="letter"
          title={isUnread ? EMPTY_UNREAD_TITLE : EMPTY_LETTER_TITLE}
          body={isUnread ? EMPTY_UNREAD_BODY : EMPTY_LETTER_BODY}
        />
      )}

      {!isEmpty && isUnread && (
        <UnreadLetterStack
          letters={unreadLetters}
          bottomInset={bottomInset}
          onPressLetter={onPressLetter}
          onScroll={handleScroll}
        />
      )}

      {!isEmpty && !isUnread && (
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
