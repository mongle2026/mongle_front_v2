import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import FAB from '../../../shared/components/action/FAB';
import TopNavigation, { TOP_NAVIGATION_TAB } from '../../../shared/components/navigation/topnavigation/TopNavigation';
import { useBottomNavigationHeight } from '../../../shared/components/navigation/bottomnavigation/BottomNavigation';
import { useGlobalOverlay } from '../../../shared/providers/GlobalOverlayProvider';
import useFeedMusicPlayback from '../../../shared/hooks/useFeedMusicPlayback';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import { colors } from '../../../shared/styles/color';
import { gap, padding } from '../../../shared/styles/token';

import FeedListState from './components/FeedListState';
import FeedPostItem from './components/FeedPostItem';
import useFeedActions from '../hooks/useFeedActions';
import useFeedHome from './hooks/useFeedHome';
import useFeedHomeFab, { DEFAULT_FAB_HEIGHT } from './hooks/useFeedHomeFab';
import useFeedHomeListController from './hooks/useFeedHomeListController';
import useFeedHomeRefresh from './hooks/useFeedHomeRefresh';

const VIEWABILITY_CONFIG = {
  viewAreaCoveragePercentThreshold: 50,
  minimumViewTime: 100,
};

const keyExtractor = item => String(item.feedId);

const FAB_OVERLAY_ID = 'feed-home-fab-overlay';

// 회색 배경의 아래쪽 절반은 solid, 위쪽 절반은 투명 → solid 그라데이션 (locations로 한 레이어에서 처리)
const FAB_BACKGROUND_GRADIENT_COLORS = ['rgba(241, 242, 244, 0)', colors.bgLayerBasement, colors.bgLayerBasement];
const FAB_BACKGROUND_GRADIENT_LOCATIONS = [0, 0.5, 1];

const FeedHomeScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState(TOP_NAVIGATION_TAB.RECOMMENDED);
  const { userId } = useCurrentUser();
  const isFollowing = activeTab === TOP_NAVIGATION_TAB.FOLLOWING;

  const {
    isFabOpen,
    handleFabOpenChange,
    handlePressFeedWrite,
    handlePressLetterWrite,
  } = useFeedHomeFab(navigation);

  const bottomNavigationHeight = useBottomNavigationHeight();
  const { openOverlay, closeOverlay } = useGlobalOverlay();

  const [fabHeight, setFabHeight] = useState(DEFAULT_FAB_HEIGHT);

  const handleFabLayout = useCallback(event => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    setFabHeight(currentHeight => (currentHeight === nextHeight ? currentHeight : nextHeight));
  }, []);

  // FAB가 열렸을 때 Dim이 BottomNavigation까지 덮도록 전역 오버레이(WindowOverlay)로 렌더링.
  // isFabOpen 변경에 반응하는 useEffect로 openOverlay를 호출하면 커밋이 한 프레임
  // 늦게 일어나서(로컬 상태 변경 → effect 실행 → 상위 Provider 리렌더) 그 사이에
  // 로컬 FAB는 이미 사라졌는데 오버레이 쪽 FAB/Dim은 아직 안 뜬 프레임이 생겨
  // 버튼이 팝업처럼 튀어 보인다. 그래서 사용자가 실제로 누른 그 이벤트 핸들러
  // 안에서 isFabOpen 변경과 openOverlay 호출을 같이 해서 같은 커밋에 배치되게 한다.
  const renderFabOverlayContent = useCallback(() => (
    <View style={[styles.fabBackground, { marginBottom: bottomNavigationHeight }]}>
      <FAB
        open
        closeOnActionPress={false}
        onOpenChange={nextOpen => {
          if (nextOpen) return;
          closeOverlay(FAB_OVERLAY_ID);
          handleFabOpenChange(false);
        }}
        onFeedPress={() => {
          closeOverlay(FAB_OVERLAY_ID);
          handlePressFeedWrite();
        }}
        onLetterPress={() => {
          closeOverlay(FAB_OVERLAY_ID);
          handlePressLetterWrite();
        }}
      />
    </View>
  ), [bottomNavigationHeight, closeOverlay, handleFabOpenChange, handlePressFeedWrite, handlePressLetterWrite]);

  const handleOpenFab = useCallback(() => {
    handleFabOpenChange(true);

    openOverlay({
      id: FAB_OVERLAY_ID,
      accessibilityLabel: '작성 메뉴 닫기',
      closeOnDimPress: true,
      closeOnBackPress: true,
      contentContainerStyle: styles.fabOverlayContent,
      onClose: () => handleFabOpenChange(false),
      renderContent: renderFabOverlayContent,
    });
  }, [handleFabOpenChange, openOverlay, renderFabOverlayContent]);

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
    postCardHeight,
    paddingTop,
    paddingBottom,
    snapToInterval,
    handleListLayout,
    handleListScrollEnd,
    handleChangeTab,
  } = useFeedHomeListController({ posts, activeTab, setActiveTab, resetPlayback, reservedBottomSpace: fabHeight });

  const { isPullRefreshing, handleRefresh } = useFeedHomeRefresh({ refetchFeed, resetPlayback });

  const feedExtraData = useMemo(
    () => ({ playingFeedId, pendingTargetUserId, likePendingFeedIds, bookmarkPendingFeedIds }),
    [bookmarkPendingFeedIds, likePendingFeedIds, pendingTargetUserId, playingFeedId]
  );

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
          cardStyle={{ height: postCardHeight }}
          likeDisabled={likePendingFeedIds.has(feedId)}
          bookmarkDisabled={bookmarkPendingFeedIds.has(feedId)}
          followDisabled={pendingTargetUserId === targetUserId}
          isMusicPlaying={isMusicPlaying}
          musicPlaybackProgress={playbackProgress}
          onPressPost={handlePressPost}
          onPressComment={handlePressComment}
          onPressLike={handlePressLike}
          onPressBookmark={handlePressBookmark}
          onPressFollow={handlePressFollow}
          onPressMusicPlayback={handlePressMusicPlayback}
          onSeekMusicPlayback={handleSeekMusicPlayback}
        />
      );
    },
    [
      bookmarkPendingFeedIds,
      handlePressBookmark,
      handlePressComment,
      handlePressFollow,
      handlePressLike,
      handlePressMusicPlayback,
      handlePressPost,
      handleSeekMusicPlayback,
      likePendingFeedIds,
      pendingTargetUserId,
      playbackProgress,
      playingFeedId,
      postCardHeight,
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

      {!isFabOpen && (
        <LinearGradient
          colors={FAB_BACKGROUND_GRADIENT_COLORS}
          locations={FAB_BACKGROUND_GRADIENT_LOCATIONS}
          style={styles.fabBackground}
          onLayout={handleFabLayout}
        >
          <FAB open={false} onOpenChange={handleOpenFab} />
        </LinearGradient>
      )}

      {isFabOpen && (
        <LinearGradient
          colors={FAB_BACKGROUND_GRADIENT_COLORS}
          locations={FAB_BACKGROUND_GRADIENT_LOCATIONS}
          style={[styles.fabBackground, { height: fabHeight }]}
        />
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
  postSeparator: {
    height: gap.M,
  },
  fabBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: padding.M,
    zIndex: 20,
    elevation: 20,
  },
  fabOverlayContent: {
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  footerLoading: {
    width: '100%',
    paddingVertical: padding.XL,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FeedHomeScreen;
