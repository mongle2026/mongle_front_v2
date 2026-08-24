import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import FAB from '../../../shared/components/action/FAB';
import TopNavigation, { TOP_NAVIGATION_TAB } from '../../../shared/components/navigation/topnavigation/TopNavigation';
import useFeedMusicPlayback from '../../../shared/hooks/useFeedMusicPlayback';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import { colors } from '../../../shared/styles/color';
import { gap, padding } from '../../../shared/styles/token';

import FeedListState from './components/FeedListState';
import FeedPostItem from './components/FeedPostItem';
import useFeedActions from '../hooks/useFeedActions';
import useFeedHome from './hooks/useFeedHome';
import useFeedHomeFab, { FAB_BOTTOM_GAP } from './hooks/useFeedHomeFab';
import useFeedHomeListController from './hooks/useFeedHomeListController';
import useFeedHomeRefresh from './hooks/useFeedHomeRefresh';

const VIEWABILITY_CONFIG = {
  viewAreaCoveragePercentThreshold: 50,
  minimumViewTime: 100,
};

const keyExtractor = item => String(item.feedId);

const FeedHomeScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState(TOP_NAVIGATION_TAB.RECOMMENDED);
  const { userId } = useCurrentUser();
  const isFollowing = activeTab === TOP_NAVIGATION_TAB.FOLLOWING;

  const { isFabOpen, handleFabOpenChange } = useFeedHomeFab(navigation);

  const {
    playingFeedId,
    playbackProgress,
    handlePressPlayback: handlePressMusicPlayback,
    handleSeekPlayback: handleSeekMusicPlayback,
    handleVisibleFeedChange,
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
    pendingTargetUserId,
  } = useFeedHome({ userId, isFollowing });

  const {
    handlePressLike,
    handlePressBookmark,
    likePendingFeedIds,
    bookmarkPendingFeedIds,
  } = useFeedActions({ userId });

  const {
    listRef,
    postMetrics,
    handlePostLayout,
    handleListLayout,
    handleListScrollEnd,
    handleChangeTab,
  } = useFeedHomeListController({ posts, activeTab, setActiveTab, resetPlayback });

  const { isPullRefreshing, handleRefresh } = useFeedHomeRefresh({ refetchFeed, resetPlayback });

  const feedExtraData = useMemo(
    () => ({ playingFeedId, pendingTargetUserId, likePendingFeedIds, bookmarkPendingFeedIds }),
    [bookmarkPendingFeedIds, likePendingFeedIds, pendingTargetUserId, playingFeedId]
  );

  const contentContainerStyle = useMemo(
    () => [
      styles.postList,
      posts.length > 0 && {
        paddingTop: postMetrics.paddingTop,
        paddingBottom: postMetrics.paddingBottom,
      },
      posts.length === 0 && styles.emptyPostList,
    ],
    [postMetrics.paddingBottom, postMetrics.paddingTop, posts.length]
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
      const feedId = Number(item?.feedId);
      if (!Number.isInteger(feedId) || feedId < 1) return;

      navigation.navigate('FeedDetail', { feedId });
    },
    [navigation]
  );

  const renderPost = useCallback(
    ({ item }) => {
      const feedId = String(item.feedId);
      const targetUserId = String(item?.user?.userId ?? '');
      const isMusicPlaying = playingFeedId === feedId;

      return (
        <View style={styles.postPage} onLayout={event => handlePostLayout(feedId, event)}>
          <FeedPostItem
            item={item}
            userId={userId}
            likeDisabled={likePendingFeedIds.has(feedId)}
            bookmarkDisabled={bookmarkPendingFeedIds.has(feedId)}
            followDisabled={pendingTargetUserId === targetUserId}
            isMusicPlaying={isMusicPlaying}
            musicPlaybackProgress={playbackProgress}
            onPressPost={handlePressPost}
            onPressLike={handlePressLike}
            onPressBookmark={handlePressBookmark}
            onPressFollow={handlePressFollow}
            onPressMusicPlayback={handlePressMusicPlayback}
            onSeekMusicPlayback={handleSeekMusicPlayback}
          />
        </View>
      );
    },
    [
      bookmarkPendingFeedIds,
      handlePostLayout,
      handlePressBookmark,
      handlePressFollow,
      handlePressLike,
      handlePressMusicPlayback,
      handlePressPost,
      handleSeekMusicPlayback,
      likePendingFeedIds,
      pendingTargetUserId,
      playbackProgress,
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

    return <FeedListState message="아직 표시할 게시물이 없습니다." />;
  }, [error, isConfigured, isLoading]);

  const handlePressBell = useCallback(() => {
    // navigation.navigate('Notification');
  }, []);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.topSafeArea}>
        <TopNavigation
          activeTab={activeTab}
          onChangeTab={handleChangeTab}
          onPressBell={handlePressBell}
        />
      </SafeAreaView>

      <FlatList
        ref={listRef}
        data={posts}
        extraData={feedExtraData}
        keyExtractor={keyExtractor}
        renderItem={renderPost}
        ItemSeparatorComponent={renderPostSeparator}
        contentContainerStyle={contentContainerStyle}
        onLayout={handleListLayout}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        snapToOffsets={postMetrics.snapOffsets}
        decelerationRate="fast"
        disableIntervalMomentum
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        updateCellsBatchingPeriod={50}
        refreshing={isPullRefreshing}
        onRefresh={handleRefresh}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        onScrollEndDrag={handleListScrollEnd}
        onMomentumScrollEnd={handleListScrollEnd}
        ListEmptyComponent={renderListEmpty}
        ListFooterComponent={renderListFooter}
      />

      {!isFabOpen && (
        <View style={styles.fabPosition}>
          <FAB open={false} onOpenChange={handleFabOpenChange} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.bgLayerBasement,
  },
  topSafeArea: {
    width: '100%',
    zIndex: 10,
    backgroundColor: colors.bgLayerBasement,
  },
  postList: {
    flexGrow: 1,
    paddingHorizontal: padding.M,
  },
  emptyPostList: {
    justifyContent: 'center',
  },
  postPage: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postSeparator: {
    height: gap.M,
  },
  fabPosition: {
    position: 'absolute',
    right: padding.XL,
    bottom: FAB_BOTTOM_GAP,
    zIndex: 20,
    elevation: 20,
  },
  footerLoading: {
    width: '100%',
    paddingVertical: padding.XL,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FeedHomeScreen;