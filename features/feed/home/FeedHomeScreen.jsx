import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import WriteFab, { DEFAULT_WRITE_FAB_HEIGHT } from '../../../shared/components/action/WriteFab';
import TopNavigation, { TOP_NAVIGATION_TAB } from '../../../shared/components/navigation/topnavigation/TopNavigation';
import useFeedMusicPlayback from '../../../shared/hooks/useFeedMusicPlayback';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import usePullRefresh from '../../../shared/hooks/usePullRefresh';
import { colors } from '../../../shared/styles/color';
import { gap, padding } from '../../../shared/styles/token';

import FeedListState from './components/FeedListState';
import FeedPostItem from './components/FeedPostItem';
import useFeedActions from '../hooks/useFeedActions';
import useFeedHome from './hooks/useFeedHome';
import useFeedHomeListController from './hooks/useFeedHomeListController';

const VIEWABILITY_CONFIG = {
  viewAreaCoveragePercentThreshold: 50,
  minimumViewTime: 100,
};

const keyExtractor = item => String(item.feedId);

const FeedHomeScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState(TOP_NAVIGATION_TAB.RECOMMENDED);
  const { userId } = useCurrentUser();
  const isFollowing = activeTab === TOP_NAVIGATION_TAB.FOLLOWING;

  const [fabHeight, setFabHeight] = useState(DEFAULT_WRITE_FAB_HEIGHT);

  const {
    playingFeedId,
    handlePressPlayback: handlePressMusicPlayback,
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
  } = useFeedActions({ userId });

  const {
    listRef,
    postCardHeight,
    paddingTop,
    paddingBottom,
    snapToInterval,
    handleListLayout,
    handleListScrollEnd,
    handleChangeTab,
  } = useFeedHomeListController({ posts, activeTab, setActiveTab, resetPlayback, reservedBottomSpace: fabHeight });

  const { isPullRefreshing, handleRefresh } = usePullRefresh({
    refetch: refetchFeed,
    onBeforeRefresh: resetPlayback,
    errorMessage: '피드 새로고침에 실패했습니다.',
  });

  const feedExtraData = useMemo(
    () => ({ playingFeedId, pendingTargetUserId }),
    [pendingTargetUserId, playingFeedId]
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
      const feedId = Number(item?.feedId);
      if (!Number.isInteger(feedId) || feedId < 1) return;

      navigation.navigate('FeedDetail', { feedId });
    },
    [navigation]
  );

  const handlePressComment = useCallback(
    item => {
      const feedId = Number(item?.feedId);
      if (!Number.isInteger(feedId) || feedId < 1) return;

      navigation.navigate('FeedDetail', { feedId, scrollToComment: true });
    },
    [navigation]
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
          followDisabled={pendingTargetUserId === targetUserId}
          isMusicPlaying={isMusicPlaying}
          onPressPost={handlePressPost}
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
      pendingTargetUserId,
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
        snapToInterval={snapToInterval}
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

      <WriteFab navigation={navigation} expandedLabel="피드 더 둘러보기" onHeightChange={setFabHeight} />
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
