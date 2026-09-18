import { memo, useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import Empty from '../../../../shared/components/content/Empty';
import Tabs, { TABS_BOTTOM_FADE_HEIGHT } from '../../../../shared/components/navigation/tabs/Tabs';
import usePullRefresh from '../../../../shared/hooks/usePullRefresh';
import { gap, padding } from '../../../../shared/styles/token';

import Card from '../../components/Card';
import useLetterBox from './hooks/useLetterBox';
import UnreadLetterStack from './components/UnreadLetterStack';

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
  // 기본 필터가 정해지기 전에는 null
  const [activeFilter, setActiveFilter] = useState(null);

  // 안 읽은 편지가 있으면 '안 읽음', 모두 읽었으면 '전체 편지'가 기본 화면이다
  const { letters: unreadQueryLetters, isLoading: isUnreadLoading } = useLetterBox({
    userId,
    filter: LETTER_FILTER.UNREAD,
  });
  const hasUnread = unreadQueryLetters.some(letter => !letter.isRead);

  // 기본 필터는 편지 탭에 들어올 때 한 번만 정한다.
  // 상세에서 마지막 안 읽은 편지를 읽고 돌아와도 '전체 편지'로 넘어가지 않고 엠티뷰를 보여준다
  if (activeFilter === null && !isUnreadLoading) {
    setActiveFilter(hasUnread ? LETTER_FILTER.UNREAD : LETTER_FILTER.ALL);
  }

  const activeFilterIndex = LETTER_FILTERS.findIndex(filter => filter.key === activeFilter);
  // 기본 필터를 정하는 중에는 목록을 그리지 않는다 (전체 → 안 읽음으로 깜빡이지 않게)
  const isDecidingFilter = activeFilter === null;

  const { letters, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetchLetters } = useLetterBox({
    userId,
    filter: activeFilter,
  });

  const isUnread = activeFilter === LETTER_FILTER.UNREAD;

  // 상세에서 읽음 처리된 편지는 안 읽음 목록에서 바로 뺀다 (useLetterDetail 이 캐시의 isRead 를 갱신)
  const unreadLetters = useMemo(() => letters.filter(letter => !letter.isRead), [letters]);
  const visibleLetters = isUnread ? unreadLetters : letters;
  const isEmpty = !isDecidingFilter && !isLoading && visibleLetters.length === 0;

  // 위로 당기면 현재 필터의 편지 목록을 다시 불러온다
  const { isPullRefreshing, handleRefresh } = usePullRefresh({
    refetch: refetchLetters,
    errorMessage: '편지함 새로고침에 실패했습니다.',
  });

  // Android 로딩 원은 Tabs 하단 그라데이션에 가리지 않게 그만큼 내린다
  const refreshControl = (
    <RefreshControl
      refreshing={isPullRefreshing}
      onRefresh={handleRefresh}
      progressViewOffset={TABS_BOTTOM_FADE_HEIGHT}
    />
  );

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

      {/* 엠티뷰에서도 당겨서 새로고침할 수 있게 ScrollView 로 감싼다 */}
      {isEmpty && (
        <ScrollView refreshControl={refreshControl} showsVerticalScrollIndicator={false}>
          <Empty
            type="letter"
            title={isUnread ? EMPTY_UNREAD_TITLE : EMPTY_LETTER_TITLE}
            body={isUnread ? EMPTY_UNREAD_BODY : EMPTY_LETTER_BODY}
          />
        </ScrollView>
      )}

      {/* 목록을 Tabs 하단 그라데이션 밑으로 올려 스크롤 시 흐려지며 사라지게 한다 */}
      {!isDecidingFilter && !isEmpty && (
        <View style={styles.listContainer}>
          {isUnread && (
            <UnreadLetterStack
              topInset={TABS_BOTTOM_FADE_HEIGHT}
              letters={unreadLetters}
              bottomInset={bottomInset}
              onPressLetter={onPressLetter}
              onScroll={handleScroll}
              refreshControl={refreshControl}
            />
          )}

          {!isUnread && (
            <ScrollView
              contentContainerStyle={{
                paddingTop: TABS_BOTTOM_FADE_HEIGHT,
                paddingBottom: bottomInset,
              }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              refreshControl={refreshControl}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.letterContainer}>
                {letters.map(letter => (
                  <Card
                    key={letter.letterId}
                    letter={letter}
                    onPress={() => onPressLetter?.(letter)}
                  />
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  listContainer: {
    flex: 1,
    marginTop: -TABS_BOTTOM_FADE_HEIGHT,
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
