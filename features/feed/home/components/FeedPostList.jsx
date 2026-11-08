import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import PullToRefresh from '../../../../shared/components/layout/PullToRefresh';
import usePullRefresh from '../../../../shared/hooks/usePullRefresh';
import { gap, padding } from '../../../../shared/styles/token';

import FeedListState from './FeedListState';
import { getSnapProps } from '../hooks/useFeedListLayout';

const VIEWABILITY_CONFIG = {
  viewAreaCoveragePercentThreshold: 50,
  minimumViewTime: 100,
};

const keyExtractor = item => String(item.feedId);

/**
 * 피드 홈의 목록 하나 (추천 또는 팔로잉).
 * 탭을 바꿔도 지우지 않고 숨겨만 두어서, 돌아오면 보던 위치 · 카드가 그대로 남아 있다
 *
 * @param {object} feed useFeedHome 이 돌려주는 목록 하나 (posts, isLoading, refetchFeed ...)
 * @param {boolean} isActive 지금 보이는 탭인지. 숨겨진 목록은 터치 · 스크린리더 · 재생 처리에서 빠진다
 * @param {React.ReactElement} emptyComponent 다 받았는데 글이 없을 때 보여 줄 화면
 * @param {(feedId) => void} onVisibleFeedChange 보이는 게시물이 바뀌었을 때 (보이는 탭일 때만 부른다)
 * @param {() => void} onBeforeRefresh 당겨서 새로고침을 시작하기 직전에 할 일
 * @param ref { scrollToTop }
 */
const FeedPostList = forwardRef(
  (
    {
      feed,
      isActive,
      isConfigured,
      emptyComponent,
      renderItem,
      extraData,
      getItemLayout,
      snapInterval,
      paddingTop,
      paddingBottom,
      onLayout,
      onVisibleFeedChange,
      onBeforeRefresh,
    },
    ref
  ) => {
    const { posts, error, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetchFeed } = feed;

    const listRef = useRef(null);

    useImperativeHandle(
      ref,
      () => ({
        scrollToTop: () => listRef.current?.scrollToOffset({ offset: 0, animated: true }),
      }),
      []
    );

    const { isPullRefreshing, handleRefresh } = usePullRefresh({
      refetch: refetchFeed,
      onBeforeRefresh,
      errorMessage: '피드 새로고침에 실패했습니다.',
    });

    // FlatList 는 onViewableItemsChanged 를 중간에 바꿀 수 없어서, 바뀌는 값은 ref 로 읽는다
    const isActiveRef = useRef(isActive);
    const onVisibleFeedChangeRef = useRef(onVisibleFeedChange);

    useEffect(() => {
      isActiveRef.current = isActive;
      onVisibleFeedChangeRef.current = onVisibleFeedChange;
    }, [isActive, onVisibleFeedChange]);

    // 숨겨진 목록이 뒤에서 다시 받아져도 보이는 탭의 재생을 멈추지 않게 한다
    const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
      if (!isActiveRef.current) return;

      const currentItem = viewableItems.find(
        ({ isViewable, item }) => isViewable && item?.feedId != null
      )?.item;

      if (currentItem) {
        onVisibleFeedChangeRef.current?.(currentItem.feedId);
      }
    }, []);

    const handleEndReached = useCallback(() => {
      if (!hasNextPage || isFetchingNextPage) return;
      void fetchNextPage();
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    const { snapToInterval, snapToOffsets } = useMemo(
      () => getSnapProps(posts.length, snapInterval),
      [posts.length, snapInterval]
    );

    const contentContainerStyle = useMemo(
      () => [
        styles.postList,
        posts.length > 0 && { paddingTop, paddingBottom },
        posts.length === 0 && styles.emptyPostList,
      ],
      [paddingBottom, paddingTop, posts.length]
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

      return emptyComponent;
    }, [emptyComponent, error, isConfigured, isLoading]);

    return (
      <View
        style={[styles.layer, !isActive && styles.hiddenLayer]}
        pointerEvents={isActive ? 'auto' : 'none'}
        accessibilityElementsHidden={!isActive}
        importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}
      >
        <PullToRefresh refreshing={isPullRefreshing} onRefresh={handleRefresh}>
          <Animated.FlatList
            ref={listRef}
            data={posts}
            extraData={extraData}
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            renderItem={renderItem}
            ItemSeparatorComponent={renderPostSeparator}
            contentContainerStyle={contentContainerStyle}
            onLayout={onLayout}
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
            ListEmptyComponent={renderListEmpty}
            ListFooterComponent={renderListFooter}
          />
        </PullToRefresh>
      </View>
    );
  }
);

FeedPostList.displayName = 'FeedPostList';

const styles = StyleSheet.create({
  // 추천 · 팔로잉 목록을 같은 자리에 겹쳐 두고, 보이는 탭만 드러낸다.
  // display: 'none' 은 네이티브 뷰를 내려서 스크롤 위치가 사라지므로 투명하게만 숨기고, 터치는 pointerEvents 로 막는다
  layer: {
    ...StyleSheet.absoluteFill,
  },
  hiddenLayer: {
    opacity: 0,
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

export default FeedPostList;
