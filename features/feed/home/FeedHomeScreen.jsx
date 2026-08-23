import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import FAB from '../../../shared/components/action/FAB';
import TopNavigation, {
  TOP_NAVIGATION_TAB,
} from '../../../shared/components/navigation/topnavigation/TopNavigation';

import {
  useGlobalOverlay,
} from '../../../shared/providers/GlobalOverlayProvider';

import useFeedMusicPlayback from '../../../shared/hooks/useFeedMusicPlayback';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import {
  useFloatingBottomOffset,
} from '../../../shared/hooks/useFloatingBottomOffset';

import {
  colors,
} from '../../../shared/styles/color';

import {
  gap,
  padding,
} from '../../../shared/styles/token';

import {
  hasImageFiles,
} from '../../../shared/utils/media';

import FeedListState from './components/FeedListState';
import FeedPostItem from './components/FeedPostItem';

import useFeedHome from './hooks/useFeedHome';

import useFeedHomeFab, {
  FAB_BOTTOM_GAP,
} from './hooks/useFeedHomeFab';

const ESTIMATED_HEIGHT_WITH_IMAGES =
  537;

const ESTIMATED_HEIGHT_WITHOUT_IMAGES =
  532;

const VIEWABILITY_CONFIG = {
  viewAreaCoveragePercentThreshold:
    50,
  minimumViewTime: 100,
};

const getEstimatedPostHeight =
  item =>
    hasImageFiles(
      item?.files,
    )
      ? ESTIMATED_HEIGHT_WITH_IMAGES
      : ESTIMATED_HEIGHT_WITHOUT_IMAGES;

const FeedHomeScreen = ({
  navigation,
}) => {
  const listRef =
    useRef(null);

  const {
    showToast,
  } = useGlobalOverlay();

  const floatingBottomOffset =
    useFloatingBottomOffset();

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    TOP_NAVIGATION_TAB.RECOMMENDED,
  );

  const [
    isPullRefreshing,
    setIsPullRefreshing,
  ] = useState(false);

  const [
    listHeight,
    setListHeight,
  ] = useState(0);

  const [
    measuredPostHeights,
    setMeasuredPostHeights,
  ] = useState({});

  const {
    userId,
  } = useCurrentUser();

  const isFollowing =
    activeTab ===
    TOP_NAVIGATION_TAB.FOLLOWING;

  const {
    isFabOpen,
    handleFabOpenChange,
  } = useFeedHomeFab(
    navigation,
  );

  const {
    playingFeedId,
    playbackProgress,
    handlePressPlayback:
      handlePressMusicPlayback,
    handleSeekPlayback:
      handleSeekMusicPlayback,
    handleVisibleFeedChange,
    resetPlayback,
  } = useFeedMusicPlayback({
    navigation,
  });

  const {
    posts,
    error,
    isConfigured,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetchFeed,
    handlePressLike,
    handlePressBookmark:
      toggleBookmark,
    handlePressFollow,
    likePendingFeedIds,
    bookmarkPendingFeedIds,
    pendingTargetUserId,
  } = useFeedHome({
    userId,
    isFollowing,
  });

  /*
   * playbackProgress는 SharedValue이므로
   * extraData에 넣지 않습니다.
   *
   * 재생 진행률 때문에 FlatList 전체가
   * 다시 렌더링되는 것을 막습니다.
   */
  const feedExtraData =
    useMemo(
      () => ({
        playingFeedId,
        pendingTargetUserId,
      }),
      [
        playingFeedId,
        pendingTargetUserId,
      ],
    );

  const postMetrics =
    useMemo(() => {
      if (
        posts.length === 0
      ) {
        return {
          snapOffsets: [],
          paddingTop: 0,
          paddingBottom: 0,
        };
      }

      const heights =
        posts.map(item => {
          const feedId =
            String(
              item.feedId,
            );

          return (
            measuredPostHeights[
              feedId
            ] ??
            getEstimatedPostHeight(
              item,
            )
          );
        });

      const firstHeight =
        heights[0];

      const lastHeight =
        heights[
          heights.length - 1
        ];

      const paddingTop =
        listHeight > 0
          ? Math.max(
              (listHeight -
                firstHeight) /
                2,
              0,
            )
          : 0;

      const paddingBottom =
        listHeight > 0
          ? Math.max(
              (listHeight -
                lastHeight) /
                2,
              0,
            )
          : 0;

      let currentTop =
        paddingTop;

      const snapOffsets =
        heights.map(height => {
          const offset =
            listHeight > 0
              ? Math.max(
                  currentTop -
                    (listHeight -
                      height) /
                      2,
                  0,
                )
              : currentTop;

          currentTop +=
            height + gap.M;

          return offset;
        });

      return {
        snapOffsets,
        paddingTop,
        paddingBottom,
      };
    }, [
      listHeight,
      measuredPostHeights,
      posts,
    ]);

  const handleChangeTab =
    useCallback(
      nextTab => {
        if (
          nextTab ===
          activeTab
        ) {
          return;
        }

        resetPlayback();

        setActiveTab(
          nextTab,
        );

        listRef.current?.scrollToOffset(
          {
            offset: 0,
            animated: false,
          },
        );
      },
      [
        activeTab,
        resetPlayback,
      ],
    );

  const handleListLayout =
    useCallback(event => {
      const nextHeight =
        Math.round(
          event.nativeEvent.layout
            .height,
        );

      setListHeight(
        currentHeight =>
          currentHeight ===
          nextHeight
            ? currentHeight
            : nextHeight,
      );
    }, []);

  const handlePostLayout =
    useCallback(
      (
        feedId,
        event,
      ) => {
        const nextHeight =
          Math.round(
            event.nativeEvent
              .layout.height,
          );

        if (
          nextHeight <= 0
        ) {
          return;
        }

        setMeasuredPostHeights(
          currentHeights => {
            if (
              currentHeights[
                feedId
              ] === nextHeight
            ) {
              return currentHeights;
            }

            return {
              ...currentHeights,
              [feedId]:
                nextHeight,
            };
          },
        );
      },
      [],
    );

  const handleViewableItemsChanged =
    useCallback(
      ({
        viewableItems,
      }) => {
        const currentItem =
          viewableItems.find(
            ({
              isViewable,
              item,
            }) =>
              isViewable &&
              item?.feedId !=
                null,
          )?.item;

        if (currentItem) {
          handleVisibleFeedChange(
            currentItem.feedId,
          );
        }
      },
      [
        handleVisibleFeedChange,
      ],
    );

  const handleRefresh =
    useCallback(async () => {
      if (
        isPullRefreshing
      ) {
        return;
      }

      resetPlayback();

      setIsPullRefreshing(
        true,
      );

      try {
        await refetchFeed({
          throwOnError: true,
        });
      } catch (error) {
        console.warn(
          '피드 새로고침에 실패했습니다.',
          error,
        );
      } finally {
        setIsPullRefreshing(
          false,
        );
      }
    }, [
      isPullRefreshing,
      refetchFeed,
      resetPlayback,
    ]);

  const handleEndReached =
    useCallback(() => {
      if (
        !hasNextPage ||
        isFetchingNextPage
      ) {
        return;
      }

      fetchNextPage();
    }, [
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
    ]);

  const handlePressPost =
    useCallback(
      item => {
        const feedId =
          Number(
            item?.feedId,
          );

        if (
          !Number.isInteger(
            feedId,
          ) ||
          feedId < 1
        ) {
          return;
        }

        resetPlayback();

        navigation.navigate(
          'FeedDetail',
          {
            feedId,
          },
        );
      },
      [
        navigation,
        resetPlayback,
      ],
    );

  const handlePressBookmarkToastButton =
    useCallback(() => {
      // 북마크 화면 route가 만들어지면
      // navigation.navigate 추가
    }, []);

  const handlePressBookmark =
    useCallback(
      feed => {
        if (
          !feed?.feedId
        ) {
          return;
        }

        const isAddingBookmark =
          !feed.isBookmarked;

        toggleBookmark(
          feed,
          {
            onSuccess: () => {
              if (
                !isAddingBookmark
              ) {
                return;
              }

              showToast({
                message:
                  '기록을 북마크에 추가했습니다.',
                buttonText:
                  '이동',
                onPressButton:
                  handlePressBookmarkToastButton,
                bottomOffset:
                  floatingBottomOffset,
              });
            },
          },
        );
      },
      [
        floatingBottomOffset,
        handlePressBookmarkToastButton,
        showToast,
        toggleBookmark,
      ],
    );

  const renderPost =
    useCallback(
      ({ item }) => {
        const feedId =
          String(
            item.feedId,
          );

        const targetUserId =
          String(
            item?.user
              ?.userId ?? '',
          );

        const isMusicPlaying =
          playingFeedId ===
          feedId;

        return (
          <View
            style={
              styles.postPage
            }
            onLayout={event =>
              handlePostLayout(
                feedId,
                event,
              )
            }
          >
            <FeedPostItem
              item={item}
              userId={
                userId
              }
              likeDisabled={likePendingFeedIds.has(
                feedId,
              )}
              bookmarkDisabled={bookmarkPendingFeedIds.has(
                feedId,
              )}
              followDisabled={
                pendingTargetUserId ===
                targetUserId
              }
              isMusicPlaying={
                isMusicPlaying
              }
              /*
               * SharedValue 객체 그대로 전달.
               * .value가 바뀌어도 React render 없음.
               */
              musicPlaybackProgress={
                playbackProgress
              }
              onPressPost={
                handlePressPost
              }
              onPressLike={
                handlePressLike
              }
              onPressBookmark={
                handlePressBookmark
              }
              onPressFollow={
                handlePressFollow
              }
              onPressMusicPlayback={
                handlePressMusicPlayback
              }
              onSeekMusicPlayback={
                handleSeekMusicPlayback
              }
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
      ],
    );

  const renderPostSeparator =
    useCallback(
      () => (
        <View
          style={
            styles.postSeparator
          }
        />
      ),
      [],
    );

  const renderListFooter =
    useCallback(() => {
      if (
        !isFetchingNextPage
      ) {
        return null;
      }

      return (
        <View
          style={
            styles.footerLoading
          }
        >
          <ActivityIndicator />
        </View>
      );
    }, [
      isFetchingNextPage,
    ]);

  const renderListEmpty =
    useCallback(() => {
      if (
        !isConfigured
      ) {
        return (
          <FeedListState message="EXPO_PUBLIC_API_BASE_URL을 확인해 주세요." />
        );
      }

      if (isLoading) {
        return (
          <FeedListState
            loading
          />
        );
      }

      if (error) {
        return (
          <FeedListState message="피드를 불러오지 못했습니다." />
        );
      }

      return (
        <FeedListState message="아직 표시할 게시물이 없습니다." />
      );
    }, [
      error,
      isConfigured,
      isLoading,
    ]);

  const handlePressBell =
    useCallback(() => {
      // navigation.navigate('Notification');
    }, []);

  return (
    <View
      style={
        styles.screen
      }
    >
      <SafeAreaView
        edges={['top']}
        style={
          styles.topSafeArea
        }
      >
        <TopNavigation
          activeTab={
            activeTab
          }
          onChangeTab={
            handleChangeTab
          }
          onPressBell={
            handlePressBell
          }
        />
      </SafeAreaView>

      <FlatList
        ref={listRef}
        data={posts}
        extraData={
          feedExtraData
        }
        keyExtractor={
          item =>
            String(
              item.feedId,
            )
        }
        renderItem={
          renderPost
        }
        ItemSeparatorComponent={
          renderPostSeparator
        }
        contentContainerStyle={[
          styles.postList,
          posts.length >
            0 && {
            paddingTop:
              postMetrics.paddingTop,
            paddingBottom:
              postMetrics.paddingBottom,
          },
          posts.length ===
            0 &&
            styles.emptyPostList,
        ]}
        onLayout={
          handleListLayout
        }
        onViewableItemsChanged={
          handleViewableItemsChanged
        }
        viewabilityConfig={
          VIEWABILITY_CONFIG
        }
        snapToOffsets={
          postMetrics.snapOffsets
        }
        decelerationRate="fast"
        disableIntervalMomentum
        showsVerticalScrollIndicator={
          false
        }
        removeClippedSubviews={
          false
        }
        refreshing={
          isPullRefreshing
        }
        onRefresh={
          handleRefresh
        }
        onEndReached={
          handleEndReached
        }
        onEndReachedThreshold={
          0.4
        }
        ListEmptyComponent={
          renderListEmpty
        }
        ListFooterComponent={
          renderListFooter
        }
      />

      {!isFabOpen && (
        <View
          style={
            styles.fabPosition
          }
        >
          <FAB
            open={false}
            onOpenChange={
              handleFabOpenChange
            }
          />
        </View>
      )}
    </View>
  );
};

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      position: 'relative',
      backgroundColor:
        colors.bgLayerBasement,
    },

    topSafeArea: {
      width: '100%',
      zIndex: 10,
      backgroundColor:
        colors.bgLayerBasement,
    },

    postList: {
      flexGrow: 1,
      paddingHorizontal:
        padding.M,
    },

    emptyPostList: {
      justifyContent:
        'center',
    },

    postPage: {
      width: '100%',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    postSeparator: {
      height: gap.M,
    },

    fabPosition: {
      position:
        'absolute',
      right: padding.XL,
      bottom:
        FAB_BOTTOM_GAP,
      zIndex: 20,
      elevation: 20,
    },

    footerLoading: {
      width: '100%',
      paddingVertical:
        padding.XL,
      alignItems:
        'center',
      justifyContent:
        'center',
    },
  });

export default FeedHomeScreen;