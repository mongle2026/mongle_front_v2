import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';

import WriteFab, { DEFAULT_WRITE_FAB_HEIGHT } from '../../../shared/components/action/WriteFab';
import Empty from '../../../shared/components/content/Empty';
import PullToRefresh from '../../../shared/components/layout/PullToRefresh';
import TopNavigation from '../../../shared/components/navigation/topnavigation/TopNavigation';
import { FEED_TAB, FEED_TOP_NAVIGATION_TABS } from '../constants';
import useFeedMusicPlayback from '../../../shared/hooks/useFeedMusicPlayback';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import { useIsSignedIn } from '../../../shared/auth/useAuthStore';
import usePullRefresh from '../../../shared/hooks/usePullRefresh';
import { colors } from '../../../shared/styles/color';
import { gap, padding } from '../../../shared/styles/token';

import FeedListState from './components/FeedListState';
import FeedPostItem from './components/FeedPostItem';
import useFeedActions from '../hooks/useFeedActions';
import useFeedHome from './hooks/useFeedHome';
import useFeedHomeListController from './hooks/useFeedHomeListController';
import useNotificationDeniedToast from './hooks/useNotificationDeniedToast';
import useBrowseNotificationPermission from './hooks/useBrowseNotificationPermission';
import useHasUnreadNotification from '../../notification/hooks/useHasUnreadNotification';
import { useCreatedFeedStore } from '../store/useCreatedFeedStore';
import { useFeedCoachmarkStore } from '../store/useFeedCoachmarkStore';
import { hasId } from '../../../shared/utils/id';

const VIEWABILITY_CONFIG = {
  viewAreaCoveragePercentThreshold: 50,
  minimumViewTime: 100,
};

const keyExtractor = item => String(item.feedId);

// 추천 ↔ 팔로잉을 바꾸면 피드가 탭 방향에서 살짝 밀려 들어오며 나타난다
const TAB_SWITCH_OFFSET = 24;
const TAB_SWITCH_TIMING = { duration: 280, easing: Easing.out(Easing.cubic) };
const getTabIndex = tab => FEED_TOP_NAVIGATION_TABS.findIndex(item => item.key === tab);

// 앱을 처음 깔고 들어왔을 때 작성 FAB 위에 띄우는 안내. 두 번째 단계는 FAB 를 펼쳐서 보여 준다
const FEED_COACHMARKS = [
  {
    title: '기록은 여기서 시작해요',
    body: '음악과 함께 피드를 남기거나\n원하는 날 도착할 편지를 쓸 수 있어요.',
    open: false,
  },
  {
    title: '무엇을 남겨 볼까요?',
    body: '피드는 모두와 나누는 오늘의 기록,\n편지는 정한 날 도착하는 마음이에요.',
    open: true,
  },
];

const FeedHomeScreen = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState(FEED_TAB.RECOMMENDED);
  const { userId } = useCurrentUser();
  const isSignedIn = useIsSignedIn();
  const hasUnreadNotification = useHasUnreadNotification();
  const isFollowing = activeTab === FEED_TAB.FOLLOWING;

  const [fabHeight, setFabHeight] = useState(DEFAULT_WRITE_FAB_HEIGHT);

  const {
    playingFeedId,
    handlePressPlayback: handlePressMusicPlayback,
    handleVisibleFeedChange,
    handOffPlayback,
    resetPlayback,
  } = useFeedMusicPlayback({ navigation });

  const {
    posts,
    error,
    isConfigured,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetchFeed,
    handlePressFollow,
    pendingTargetUserIds,
  } = useFeedHome({ userId, isFollowing });

  const {
    handlePressLike,
    handlePressBookmark,
  } = useFeedActions({ userId });

  const isFocused = useIsFocused();
  const isCoachmarkRestored = useFeedCoachmarkStore(state => state.isRestored);
  const isCoachmarkCompleted = useFeedCoachmarkStore(state => state.isCompleted);
  const restoreCoachmark = useFeedCoachmarkStore(state => state.restore);
  const completeCoachmark = useFeedCoachmarkStore(state => state.complete);
  // 온보딩에서 로그인 없이 들어왔으면 알림 권한 창 → 코치마크 → 알림 거절 안내 Toast 순으로 띄운다
  const isRequestingNotificationPermission = useBrowseNotificationPermission({ navigation, route });
  const isCoachmarkPending =
    isCoachmarkRestored && !isCoachmarkCompleted && !isRequestingNotificationPermission;

  useEffect(() => {
    void restoreCoachmark();
  }, [restoreCoachmark]);

  // 알림 거절 안내 Toast 는 코치마크가 끝난 뒤에 띄운다
  useNotificationDeniedToast({
    enabled: isCoachmarkRestored && isCoachmarkCompleted && !isRequestingNotificationPermission,
  });

  const {
    listRef,
    postCardHeight,
    paddingTop,
    paddingBottom,
    snapToInterval,
    snapToOffsets,
    getItemLayout,
    handleListLayout,
    handleListScrollEnd,
    handleChangeTab,
    scrollToTop,
  } = useFeedHomeListController({ posts, activeTab, setActiveTab, resetPlayback, reservedBottomSpace: fabHeight });

  const { isPullRefreshing, handleRefresh } = usePullRefresh({
    refetch: refetchFeed,
    onBeforeRefresh: resetPlayback,
    errorMessage: '피드 새로고침에 실패했습니다.',
  });

  // 피드 탭에 있는 상태에서 하단 피드 버튼을 다시 누르면 새로고침 없이 맨 위로만 올린다
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      if (navigation.isFocused()) scrollToTop();
    });

    return unsubscribe;
  }, [navigation, scrollToTop]);

  // 피드를 작성하고 돌아오면 새 글이 맨 위에 온 뒤에 스크롤을 올린다
  // 팔로잉 피드에는 내 글이 없어서 추천 탭으로 옮긴다
  const createdFeedId = useCreatedFeedStore(state => state.createdFeedId);
  const clearCreatedFeedId = useCreatedFeedStore(state => state.clearCreatedFeedId);
  const firstFeedId = posts[0]?.feedId;

  useEffect(() => {
    if (createdFeedId == null) return;

    if (activeTab !== FEED_TAB.RECOMMENDED) {
      resetPlayback();
      setActiveTab(FEED_TAB.RECOMMENDED);
      return;
    }

    if (String(firstFeedId) !== String(createdFeedId)) return;

    scrollToTop();
    clearCreatedFeedId();
  }, [activeTab, clearCreatedFeedId, createdFeedId, firstFeedId, resetPlayback, scrollToTop]);

  /*
   * 탭 전환: 목록이 그 탭의 스크롤 위치로 돌아가는 순간(다음 프레임)이 보이지 않게
   * 투명한 상태에서 시작해, 오른쪽 탭(팔로잉)이면 오른쪽에서 · 왼쪽 탭(추천)이면 왼쪽에서 들어온다
   */
  const tabSwitchProgress = useSharedValue(1);
  const tabSwitchDirection = useSharedValue(0);
  const prevTabRef = useRef(activeTab);

  useEffect(() => {
    const prevTab = prevTabRef.current;
    if (prevTab === activeTab) return;
    prevTabRef.current = activeTab;

    tabSwitchDirection.value = Math.sign(getTabIndex(activeTab) - getTabIndex(prevTab));
    tabSwitchProgress.value = 0;
    tabSwitchProgress.value = withTiming(1, TAB_SWITCH_TIMING);
  }, [activeTab, tabSwitchDirection, tabSwitchProgress]);

  const tabSwitchStyle = useAnimatedStyle(() => ({
    opacity: tabSwitchProgress.value,
    transform: [
      {
        translateX: (1 - tabSwitchProgress.value) * TAB_SWITCH_OFFSET * tabSwitchDirection.value,
      },
    ],
  }));

  const feedExtraData = useMemo(
    () => ({ playingFeedId, pendingTargetUserIds }),
    [pendingTargetUserIds, playingFeedId]
  );

  // 카드마다 새 객체를 넘기면 FeedPostItem memo가 깨져서
  // 재생 중인 카드가 바뀔 때마다 보이는 카드 전부가 다시 그려진다
  const cardStyle = useMemo(() => ({ height: postCardHeight }), [postCardHeight]);

  const contentContainerStyle = useMemo(
    () => [
      styles.postList,
      posts.length > 0 && { paddingTop, paddingBottom },
      posts.length === 0 && styles.emptyPostList,
    ],
    [paddingBottom, paddingTop, posts.length]
  );

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }) => {
      const currentItem = viewableItems.find(
        ({ isViewable, item }) => isViewable && item?.feedId != null
      )?.item;

      if (currentItem) {
        handleVisibleFeedChange(currentItem.feedId);
      }
    },
    [handleVisibleFeedChange]
  );

  const handleEndReached = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handlePressPost = useCallback(
    item => {
      const feedId = item?.feedId;
      if (!hasId(feedId)) return;

      // 이 피드를 재생 중이었으면 상세에서 노래가 이어서 나온다
      handOffPlayback(feedId);
      navigation.navigate('FeedDetail', { feedId });
    },
    [handOffPlayback, navigation]
  );

  const handlePressProfile = useCallback(
    item => {
      const targetUserId = item?.user?.userId;
      if (!hasId(targetUserId)) return;

      navigation.navigate('UserProfile', { userId: targetUserId });
    },
    [navigation]
  );

  const handlePressComment = useCallback(
    item => {
      const feedId = item?.feedId;
      if (!hasId(feedId)) return;

      handOffPlayback(feedId);
      navigation.navigate('FeedDetail', { feedId, scrollToComment: true });
    },
    [handOffPlayback, navigation]
  );

  const renderPost = useCallback(
    ({ item }) => {
      const feedId = String(item.feedId);
      const targetUserId = String(item?.user?.userId ?? '');
      const isMusicPlaying = playingFeedId === feedId;

      return (
        <FeedPostItem
          item={item}
          userId={userId}
          cardStyle={cardStyle}
          followDisabled={pendingTargetUserIds.has(targetUserId)}
          isMusicPlaying={isMusicPlaying}
          onPressPost={handlePressPost}
          onPressProfile={handlePressProfile}
          onPressComment={handlePressComment}
          onPressLike={handlePressLike}
          onPressBookmark={handlePressBookmark}
          onPressFollow={handlePressFollow}
          onPressMusicPlayback={handlePressMusicPlayback}
        />
      );
    },
    [
      cardStyle,
      handlePressBookmark,
      handlePressComment,
      handlePressFollow,
      handlePressLike,
      handlePressMusicPlayback,
      handlePressPost,
      handlePressProfile,
      pendingTargetUserIds,
      playingFeedId,
      userId,
    ]
  );

  const renderPostSeparator = useCallback(() => <View style={styles.postSeparator} />, []);

  const renderListFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;

    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator />
      </View>
    );
  }, [isFetchingNextPage]);

  const renderListEmpty = useCallback(() => {
    if (!isConfigured) return <FeedListState message="EXPO_PUBLIC_API_BASE_URL을 확인해 주세요." />;
    if (isLoading) return <FeedListState loading />;
    if (error) return <FeedListState message="피드를 불러오지 못했습니다." />;

    if (isFollowing) {
      return (
        <Empty
          type="followingFeed"
          title="아직 아무도 팔로우하지 않았어요."
          body="팔로우하고 음악과 기록을 만나보세요."
        />
      );
    }

    return <FeedListState message="아직 표시할 게시물이 없습니다." />;
  }, [error, isConfigured, isFollowing, isLoading]);

  const handlePressBell = useCallback(() => {
    navigation.navigate('Notification');
  }, [navigation]);

  const handlePressLogin = useCallback(() => {
    navigation.navigate('Welcome');
  }, [navigation]);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.topSafeArea}>
        <TopNavigation
          tabs={FEED_TOP_NAVIGATION_TABS}
          activeTab={activeTab}
          onChangeTab={handleChangeTab}
          onPressButton={handlePressBell}
          showDot={hasUnreadNotification}
        />
      </SafeAreaView>

      <Animated.View style={[styles.listTransition, tabSwitchStyle]}>
        <PullToRefresh refreshing={isPullRefreshing} onRefresh={handleRefresh}>
          <Animated.FlatList
            ref={listRef}
            data={posts}
            extraData={feedExtraData}
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            renderItem={renderPost}
            ItemSeparatorComponent={renderPostSeparator}
            contentContainerStyle={contentContainerStyle}
            onLayout={handleListLayout}
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={VIEWABILITY_CONFIG}
            snapToInterval={snapToInterval}
            snapToOffsets={snapToOffsets}
            decelerationRate="fast"
            disableIntervalMomentum
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={Platform.OS === 'android'}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            windowSize={5}
            updateCellsBatchingPeriod={50}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.4}
            onScrollEndDrag={handleListScrollEnd}
            onMomentumScrollEnd={handleListScrollEnd}
            ListEmptyComponent={renderListEmpty}
            ListFooterComponent={renderListFooter}
          />
        </PullToRefresh>

        {/* 로그인하지 않았으면 팔로잉 목록 대신 엠티뷰로 덮는다 (목록은 탭별 스크롤 위치 때문에 그대로 둔다) */}
        {isFollowing && !isSignedIn && (
          <View style={[styles.loginEmpty, { paddingBottom: fabHeight }]}>
            <Empty
              type="login"
              title="로그인이 필요해요"
              buttonLabel="로그인하러 가기"
              onButtonPress={handlePressLogin}
            />
          </View>
        )}
      </Animated.View>

      <WriteFab
        navigation={navigation}
        expandedLabel="피드 더 둘러보기"
        onHeightChange={setFabHeight}
        coachmarks={isFocused && isCoachmarkPending ? FEED_COACHMARKS : undefined}
        onCoachmarkEnd={completeCoachmark}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.bgBase,
  },
  topSafeArea: {
    width: '100%',
    zIndex: 10,
    backgroundColor: colors.bgBase,
  },
  listTransition: {
    flex: 1,
  },
  // FAB 에 가려지는 높이(paddingBottom)를 빼고 가운데에 둔다
  loginEmpty: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    backgroundColor: colors.bgBase,
  },
  postList: {
    flexGrow: 1,
    paddingHorizontal: padding.M,
  },
  emptyPostList: {
    justifyContent: 'center',
  },
  postSeparator: {
    height: gap.M,
  },
  footerLoading: {
    width: '100%',
    paddingVertical: padding.XL,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FeedHomeScreen;
