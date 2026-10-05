import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import ListControlBar from '../../../shared/components/action/ListControlBar';
import Menu from '../../../shared/components/action/menu/Menu';
import Empty from '../../../shared/components/content/Empty';
import PullToRefresh from '../../../shared/components/layout/PullToRefresh';
import { MAIN_TAB_ROUTES } from '../../../shared/components/navigation/bottomnavigation/routeNames';
import Tabs, { TABS_BOTTOM_FADE_HEIGHT } from '../../../shared/components/navigation/tabs/Tabs';
import usePullRefresh from '../../../shared/hooks/usePullRefresh';
import { gap, padding } from '../../../shared/styles/token';

import OthersPostCard from '../components/OthersPostCard';
import { toOthersPost } from '../utils/postCardProps';
import useSortMenu from '../hooks/useSortMenu';
import useBookmarkFeeds from './hooks/useBookmarkFeeds';

const BOOKMARK_FILTER = {
  ALL: 'all',
  FOLLOWING: 'following',
};

const BOOKMARK_FILTERS = [
  { key: BOOKMARK_FILTER.ALL, label: '전체' },
  { key: BOOKMARK_FILTER.FOLLOWING, label: '팔로잉' },
];

/* Tabs 는 인덱스 기반이라 key 와 매핑한다 */
const BOOKMARK_FILTER_LABELS = BOOKMARK_FILTERS.map(filter => filter.label);

const SORT_OPTIONS = [
  { key: 'latest', label: '최신순' },
  { key: 'oldest', label: '오래된순' },
];

const END_REACHED_THRESHOLD = 0.5;

const postKeyExtractor = post => String(post.feedId);

// 보관함 - 북마크. 전체 / 팔로잉 필터와 정렬만 있고 따로 들어가는 화면은 없다.
const BookmarkSection = ({ navigation, userId }) => {
  const [activeFilter, setActiveFilter] = useState(BOOKMARK_FILTER.ALL);
  const activeFilterIndex = BOOKMARK_FILTERS.findIndex(filter => filter.key === activeFilter);

  const {
    sortKey,
    sortLabel,
    isSortMenuOpen,
    sortMenuTop,
    openSortMenu: openSortMenuAt,
    closeSortMenu,
    sortMenuItems,
  } = useSortMenu(SORT_OPTIONS);

  const {
    feeds,
    isBookmarkFeedsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetchBookmarkFeeds,
  } = useBookmarkFeeds({ userId, filter: activeFilter, sort: sortKey });

  const posts = useMemo(() => feeds.map(toOthersPost), [feeds]);
  const isEmpty = !isBookmarkFeedsLoading && posts.length === 0;

  const { isPullRefreshing, handleRefresh } = usePullRefresh({
    refetch: refetchBookmarkFeeds,
    errorMessage: '북마크 새로고침에 실패했습니다.',
  });

  const handleChangeFilter = useCallback(index => {
    setActiveFilter(BOOKMARK_FILTERS[index].key);
  }, []);

  const handlePressPost = useCallback(
    feedId => navigation.navigate('FeedDetail', { feedId }),
    [navigation],
  );

  const handlePressBrowseFeed = useCallback(
    () => navigation.navigate(MAIN_TAB_ROUTES.FEED),
    [navigation],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderPost = useCallback(({ item: post }) => (
    <OthersPostCard
      profile={post.profile}
      music={post.music}
      font={post.font}
      content={post.content}
      imageSources={post.imageSources}
      date={post.date}
      onPress={() => handlePressPost(post.feedId)}
    />
  ), [handlePressPost]);

  // 메뉴를 ListControlBar 바로 밑에 둔다. ListControlBar 는 controlBar 안에 겹쳐 있어서 두 위치를 더한다
  const controlBarTopRef = useRef(0);
  const listControlBarBottomRef = useRef(0);

  const handleControlBarLayout = useCallback(e => {
    controlBarTopRef.current = e.nativeEvent.layout.y;
  }, []);

  const handleListControlBarLayout = useCallback(e => {
    const { y, height } = e.nativeEvent.layout;
    listControlBarBottomRef.current = y + height;
  }, []);

  const openSortMenu = useCallback(() => {
    openSortMenuAt(controlBarTopRef.current + listControlBarBottomRef.current);
  }, [openSortMenuAt]);

  return (
    <View style={styles.screen}>
      {/* Tabs 는 전체 폭으로 깔아 하단 그라데이션을 살리고, ListControlBar 는 그 위에 겹쳐 올린다 */}
      <View style={styles.controlBar} onLayout={handleControlBarLayout}>
        <Tabs
          tabs={BOOKMARK_FILTER_LABELS}
          activeIndex={activeFilterIndex}
          onChange={handleChangeFilter}
        />
        <View style={styles.listControlBar} onLayout={handleListControlBarLayout}>
          <ListControlBar text={sortLabel} onPress={openSortMenu} style={styles.listControlBarInner} />
        </View>
      </View>

      {/* 엠티뷰에서도 당겨서 새로고침할 수 있게 ScrollView 로 감싼다 */}
      {isEmpty && (
        <PullToRefresh refreshing={isPullRefreshing} onRefresh={handleRefresh}>
          <Animated.ScrollView
            contentContainerStyle={styles.emptyContainer}
            showsVerticalScrollIndicator={false}
          >
            <Empty
              type="bookmark"
              title="아직 북마크한 피드가 없어요."
              body="마음에 드는 피드를 북마크해 보세요."
              buttonLabel="피드 둘러보기"
              onButtonPress={handlePressBrowseFeed}
            />
          </Animated.ScrollView>
        </PullToRefresh>
      )}

      {/* 새로고침 스피너는 Tabs 하단 그라데이션에 가리지 않게 그만큼 내린다 */}
      {!isEmpty && (
        <PullToRefresh
          refreshing={isPullRefreshing}
          onRefresh={handleRefresh}
          indicatorOffset={TABS_BOTTOM_FADE_HEIGHT}
          style={styles.list}
        >
          <Animated.FlatList
            data={posts}
            keyExtractor={postKeyExtractor}
            renderItem={renderPost}
            onEndReached={handleEndReached}
            onEndReachedThreshold={END_REACHED_THRESHOLD}
            contentContainerStyle={styles.postContainer}
          />
        </PullToRefresh>
      )}

      {/* 메뉴가 열리면 섹션 전체를 덮는 레이어를 깔아 바깥 어디를 눌러도 닫는다 */}
      {isSortMenuOpen && (
        <>
          <Pressable style={[StyleSheet.absoluteFill, styles.menuOverlay]} onPress={closeSortMenu} />
          <Menu items={sortMenuItems} style={[styles.sortMenu, { top: sortMenuTop }]} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
  },
  // 목록이 Tabs 밑으로 들어오므로 Tabs 쪽이 위에 그려지게 한다
  controlBar: {
    alignSelf: 'stretch',
    zIndex: 1,
  },
  // Tabs 오른쪽 위에 겹쳐 둔다. Tabs 자체가 zIndex 1 이라 그보다 높여야 Tabs 배경 위에 보인다
  listControlBar: {
    position: 'absolute',
    zIndex: 2,
    top: 6,
    right: 0,
  },
  // ListControlBar 기본 width 100%·배경색을 풀어 Tabs 위에 글자만 보이게 한다
  listControlBarInner: {
    width: 'auto',
    backgroundColor: 'transparent',
  },
  // 그라데이션 높이만큼 Tabs 밑으로 넣어야 카드가 그라데이션 아래로 사라진다
  list: {
    marginTop: -TABS_BOTTOM_FADE_HEIGHT,
  },
  // FlatList는 카드마다 셀 View로 감싼다. flex-start면 셀이 카드 폭으로 줄어들어서 stretch로 둔다
  postContainer: {
    paddingTop: TABS_BOTTOM_FADE_HEIGHT,
    paddingHorizontal: padding.L,
    paddingBottom: padding.XXL,
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: gap.M,
    alignSelf: 'stretch',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  // controlBar(zIndex 1) 보다 위에 있어야 탭을 눌러도 메뉴가 먼저 닫힌다
  menuOverlay: {
    zIndex: 2,
  },
  sortMenu: {
    position: 'absolute',
    zIndex: 2,
    right: 12,
  },
});

export default memo(BookmarkSection);
