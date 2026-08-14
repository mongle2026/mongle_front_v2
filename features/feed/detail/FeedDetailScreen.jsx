import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import IcTrash from '../../../assets/icons/ic_trash.svg';

import MusicCard from '../../../shared/components/content/MusicCard';
import TopIconNavigation from '../../../shared/components/navigation/topnavigation/TopIconNavigation';
import Menu from '../../../shared/components/action/menu/Menu';
import Item from '../../../shared/components/action/menu/Item';
import { Dialog } from '../../../shared/components/action/Dialog';
import { useGlobalOverlay } from '../../../shared/components/layout/GlobalOverlayProvider';
import Toast from '../../../shared/components/feedback/Toast';

import useFeedMusicPlayback from '../../../shared/hooks/useFeedMusicPlayback';
import { useFloatingBottomOffset } from '../../../shared/hooks/useFloatingBottomOffset';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import { useToast } from '../../../shared/hooks/useToast';

import { colors, shadow } from '../../../shared/styles/color';
import { padding, radius } from '../../../shared/styles/token';
import {
  getImageSources,
  resolveMediaUri,
} from '../../../shared/utils/media';

import ActionBar from '../home/components/ActionBar';
import ProfileBar from '../home/components/ProfileBar';

import FeedDetailContent from './components/FeedDetailContent';
import CommentSection from './components/CommentSection';
import CommentBar from './components/CommentBar';

import useFeedDetail from './hooks/useFeedDetail';
import useFeedComments from './hooks/useFeedComments';
import useFeedToggleMutation from '../hooks/useFeedToggleMutation';
import useDoubleTapLike from '../hooks/useDoubleTapLike';

const FeedDetailScreen = ({ navigation, route }) => {
  const { openOverlay } = useGlobalOverlay();
  const { currentUser, userId } = useCurrentUser();
  const { height: windowHeight } = useWindowDimensions();
  const { toast, showToast } = useToast();

  const commentBarRef = useRef(null);
  const commentMenuOverlayRef = useRef(null);

  const feedId = route?.params?.feedId;
  const floatingBottomOffset = useFloatingBottomOffset();

  const [commentText, setCommentText] = useState('');
  const [isFeedMenuOpen, setIsFeedMenuOpen] = useState(false);
  const [commentMenu, setCommentMenu] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyFocusRequestKey, setReplyFocusRequestKey] = useState(0);
  const [commentBarHeight, setCommentBarHeight] = useState(0);

  const {
    feed,
    isConfigured,
    isLoading,
    error,
    deleteFeed,
    isDeletingFeed,
  } = useFeedDetail({
    feedId,
    userId,
    onDeleteSuccess: () => {
      navigation.goBack();
    },
  });

  const {
    comments,
    isLoadingComments,
    createComment,
    isCreatingComment,
    deleteComment,
    isDeletingComment,
  } = useFeedComments({
    feedId,
    userId,
  });

  const {
    mutate: mutateLike,
    pendingFeedIds: likePendingFeedIds,
  } = useFeedToggleMutation({
    userId,
    endpoint: 'like',
    valueKey: 'isLiked',
    countKey: 'likeCount',
    errorMessage: '좋아요 처리에 실패했습니다.',
  });

  const {
    mutate: mutateBookmark,
    pendingFeedIds: bookmarkPendingFeedIds,
  } = useFeedToggleMutation({
    userId,
    endpoint: 'bookmark',
    valueKey: 'isBookmarked',
    countKey: 'bookmarkCount',
    errorMessage: '북마크 처리에 실패했습니다.',
  });

  const handlePressLike = useCallback(() => {
    if (!feed?.feedId) return;
    mutateLike({
      feedId: feed.feedId,
      nextValue: !feed.isLiked,
    });
  }, [feed, mutateLike]);

  const handlePressBookmark = useCallback(() => {
    if (!feed?.feedId) return;
    mutateBookmark({
      feedId: feed.feedId,
      nextValue: !feed.isBookmarked,
    });
  }, [feed, mutateBookmark]);

  const normalizedFeedId =
    feed?.feedId != null ? String(feed.feedId) : null;

  const {
    likeButtonRef,
    handleTap: handleContentTap,
  } = useDoubleTapLike({
    isLiked: Boolean(feed?.isLiked),
    disabled:
      normalizedFeedId != null &&
      likePendingFeedIds.has(normalizedFeedId),
    onLike: handlePressLike,
  });

  const {
    playingFeedId,
    playbackProgress,
    handlePressPlayback,
    handleSeekPlayback,
  } = useFeedMusicPlayback({
    navigation,
  });

  const handlePressClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handlePressShare = useCallback(() => {
    // 공유 기능 추후 구현
  }, []);

  const handlePressMore = useCallback(() => {
    setCommentMenu(null);
    setIsFeedMenuOpen(previous => !previous);
  }, []);

  const handlePressEdit = useCallback(() => {
    setIsFeedMenuOpen(false);
    // 수정 기능 추후 구현
  }, []);

  const handlePressDelete = useCallback(() => {
    if (isDeletingFeed) return;
    setIsFeedMenuOpen(false);
    openOverlay({
      id: 'feed-delete-dialog',
      closeOnDimPress: true,
      closeOnBackPress: true,
      accessibilityLabel: '삭제 확인 창 닫기',
      contentContainerStyle: styles.dialogOverlayContent,
      renderContent: ({ close }) => (
        <Dialog
          title="기록을 삭제하시겠어요?"
          description="삭제한 기록은 다시 복구할 수 없어요."
          cancelText="취소"
          confirmText="삭제"
          onCancel={close}
          onConfirm={() => {
            close();
            deleteFeed();
          }}
        />
      ),
    });
  }, [deleteFeed, isDeletingFeed, openOverlay]);

  const handleCommentBarLayout = useCallback(event => {
    const height = event.nativeEvent.layout.height;
    setCommentBarHeight(previousHeight =>
      previousHeight === height ? previousHeight : height,
    );
  }, []);

  const handleSubmitComment = useCallback(
    async content => {
      try {
        await createComment({
          content,
          parentCommentId: replyTarget?.commentId ?? null,
        });
        setCommentText('');
        setReplyTarget(null);
      } catch {
        // useFeedComments에서 처리
      }
    },
    [createComment, replyTarget],
  );

  const handlePressCommentMenu = useCallback((comment, anchor) => {
    if (!comment?.commentId || !anchor) return;
    setIsFeedMenuOpen(false);
    setCommentMenu(previous => {
      const isSameComment =
        previous?.comment?.commentId != null &&
        String(previous.comment.commentId) === String(comment.commentId);
      if (isSameComment) return null;
      return {
        comment,
        anchor,
        top: 0,
        isMeasured: false,
      };
    });
  }, []);

  const handleCommentMenuLayout = useCallback(event => {
    const menuHeight = event.nativeEvent.layout.height;

    const updateMenuPosition = (overlayY, commentBarTop) => {
      setCommentMenu(previous => {
        if (!previous) return previous;

        const anchorTop = previous.anchor.y;
        const anchorBottom = previous.anchor.y + previous.anchor.height;
        const belowBottom = anchorBottom + menuHeight;

        const shouldOpenAbove = belowBottom > commentBarTop;

        const menuTopInWindow = shouldOpenAbove
          ? anchorTop - menuHeight
          : anchorBottom;

        const menuTopInOverlay = Math.max(
          0,
          menuTopInWindow - overlayY,
        );

        if (
          previous.isMeasured &&
          previous.top === menuTopInOverlay
        ) {
          return previous;
        }

        return {
          ...previous,
          top: menuTopInOverlay,
          isMeasured: true,
        };
      });
    };

    const measurePosition = overlayY => {
      if (commentBarRef.current) {
        commentBarRef.current.measureInWindow((x, y) => {
          updateMenuPosition(overlayY, y);
        });
        return;
      }

      updateMenuPosition(
        overlayY,
        windowHeight - floatingBottomOffset - commentBarHeight,
      );
    };

    if (commentMenuOverlayRef.current) {
      commentMenuOverlayRef.current.measureInWindow((x, y) => {
        measurePosition(y);
      });
      return;
    }

    measurePosition(0);
  }, [
    commentBarHeight,
    floatingBottomOffset,
    windowHeight,
  ]);

  const handlePressDeleteComment = useCallback(() => {
    if (!commentMenu?.comment || isDeletingComment) return;

    const targetComment = commentMenu.comment;

    setCommentMenu(null);

    openOverlay({
      id: 'comment-delete-dialog',
      closeOnDimPress: true,
      closeOnBackPress: true,
      accessibilityLabel: '댓글 삭제 확인 창 닫기',
      contentContainerStyle: styles.dialogOverlayContent,
      renderContent: ({ close }) => (
        <Dialog
          title="댓글을 영구 삭제할까요?"
          description="삭제한 댓글은 다시 되돌릴 수 없습니다."
          cancelText="취소"
          confirmText="삭제"
          onCancel={close}
          onConfirm={async () => {
            close();

            try {
              await deleteComment(targetComment.commentId);

              showToast({
                message: '댓글을 삭제했습니다.',
              });
            } catch {
              // useFeedComments에서 에러 처리
            }
          }}
        />
      ),
    });
  }, [
    commentMenu,
    deleteComment,
    isDeletingComment,
    openOverlay,
    showToast,
  ]);

  const handlePressReply = useCallback(comment => {
    if (!comment?.commentId) return;

    setCommentMenu(null);

    setReplyTarget({
      commentId: comment.commentId,
      userId: comment.userId,
      userCode: comment.userCode,
    });

    setReplyFocusRequestKey(previous => previous + 1);
  }, []);

  if (!feed) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top']} style={styles.topSafeArea}>
          <TopIconNavigation
            onPressClose={handlePressClose}
            onPressShare={handlePressShare}
            onPressMore={handlePressMore}
          />
        </SafeAreaView>
        <View style={styles.state}>
          {isLoading && <ActivityIndicator />}
          {!isConfigured && (
            <Text
              allowFontScaling={false}
              style={styles.stateText}
            >
              EXPO_PUBLIC_API_BASE_URL을 확인해 주세요.
            </Text>
          )}
          {error && (
            <Text
              allowFontScaling={false}
              style={styles.stateText}
            >
              기록을 불러오지 못했습니다.
            </Text>
          )}
        </View>
      </View>
    );
  }

  const user = feed.user ?? {};
  const music = feed.music ?? {};
  const record = feed.record ?? {};

  const imageSources = getImageSources(feed.files);
  const profileImageUri = resolveMediaUri(user.profileImageUrl);
  const musicArtworkUri = resolveMediaUri(music.musicArtwork);
  const musicPreviewUri = resolveMediaUri(music.previewUrl);

  const isMine = Number(user.userId) === Number(userId);
  const isFollowing = Boolean(user.isFollowing);
  const isMusicPlaying = playingFeedId === normalizedFeedId;

  const handleMusicPlayback = () => {
    if (!musicPreviewUri) return;
    handlePressPlayback({
      feedId: feed.feedId,
      previewUrl: musicPreviewUri,
    });
  };

  const handleMusicSeek = progress => {
    if (!musicPreviewUri) return;
    handleSeekPlayback({
      feedId: feed.feedId,
      progress,
    });
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView
        edges={['top']}
        style={styles.topSafeArea}
      >
        <View style={styles.topNavigationContainer}>
          <TopIconNavigation
            onPressClose={handlePressClose}
            onPressShare={handlePressShare}
            onPressMore={handlePressMore}
          />
          {isFeedMenuOpen && (
            <Menu
              style={styles.menu}
              onPressEdit={handlePressEdit}
              onPressDelete={handlePressDelete}
              deleteDisabled={isDeletingFeed}
            />
          )}
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              commentBarHeight +
              floatingBottomOffset,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => {
          setCommentMenu(null);
          setIsFeedMenuOpen(false);
        }}
      >
        <ProfileBar
          imageUri={profileImageUri}
          username={user.userCode ?? ''}
          showFollowButton={!isMine}
          followLabel={
            isFollowing
              ? '팔로잉'
              : '팔로우'
          }
          followVariant={
            isFollowing
              ? 'Ghost'
              : 'Solid'
          }
        />

        <MusicCard
          imageSource={
            musicArtworkUri
              ? {
                uri: musicArtworkUri,
              }
              : undefined
          }
          title={music.musicTitle ?? ''}
          artist={music.musicArtist ?? ''}
          isPlaying={isMusicPlaying}
          playbackProgress={
            isMusicPlaying
              ? playbackProgress
              : 0
          }
          disabled={!musicPreviewUri}
          onPressPlayback={
            musicPreviewUri
              ? handleMusicPlayback
              : undefined
          }
          onSeekPlayback={
            musicPreviewUri
              ? handleMusicSeek
              : undefined
          }
        />

        <FeedDetailContent
          content={record.text ?? ''}
          imageSources={imageSources}
          authorFont={record.authorFont}
          onPress={handleContentTap}
        />

        <ActionBar
          createdAt={feed.createdAt}
          isLiked={Boolean(feed.isLiked)}
          isBookmarked={Boolean(feed.isBookmarked)}
          bookmarkCount={feed.bookmarkCount}
          likeDisabled={
            likePendingFeedIds.has(
              normalizedFeedId,
            )
          }
          bookmarkDisabled={
            bookmarkPendingFeedIds.has(
              normalizedFeedId,
            )
          }
          likeButtonRef={likeButtonRef}
          onLikePress={handlePressLike}
          onBookmarkPress={handlePressBookmark}
        />

        <CommentSection
          comments={comments}
          isLoading={isLoadingComments}
          openCommentMenuId={
            commentMenu?.comment?.commentId ??
            null
          }
          onPressMenu={
            handlePressCommentMenu
          }
          onPressReply={
            handlePressReply
          }
        />
      </ScrollView>

      <View
        ref={commentBarRef}
        collapsable={false}
        onLayout={handleCommentBarLayout}
        style={[
          styles.commentBarContainer,
          {
            bottom: floatingBottomOffset,
          },
        ]}
      >
        <CommentBar
          value={commentText}
          onChangeText={setCommentText}
          onSubmit={handleSubmitComment}
          disabled={isCreatingComment}
          profileImageUri={
            currentUser?.profileImageUri
          }
          targetUsername={
            replyTarget?.userCode ??
            user.userCode ??
            ''
          }
          focusRequestKey={
            replyFocusRequestKey
          }
        />
      </View>

      {toast.visible && (
        <View
          pointerEvents="box-none"
          style={[
            styles.toastContainer,
            {
              bottom:
                floatingBottomOffset,
            },
          ]}
        >
          <Toast
            text={toast.message}
            buttonText={toast.buttonText}
            onPressButton={toast.onPressButton}
          />
        </View>
      )}

      {commentMenu && (
        <View
          ref={commentMenuOverlayRef}
          collapsable={false}
          style={styles.commentMenuOverlay}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() =>
              setCommentMenu(null)
            }
          />

          <View
            onLayout={
              handleCommentMenuLayout
            }
            style={[
              styles.commentMenu,
              {
                top: commentMenu.top,
                opacity:
                  commentMenu.isMeasured
                    ? 1
                    : 0,
              },
            ]}
          >
            <Item
              icon={IcTrash}
              label="삭제"
              color={colors.fgCritical}
              onPress={handlePressDeleteComment}
              disabled={isDeletingComment}
              accessibilityLabel="댓글 삭제"
              style={styles.commentDeleteItem}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgLayerDefault,
  },
  topSafeArea: {
    width: '100%',
    position: 'relative',
    backgroundColor: colors.bgLayerDefault,
    zIndex: 20,
  },
  topNavigationContainer: {
    width: '100%',
    position: 'relative',
    zIndex: 20,
  },
  menu: {
    position: 'absolute',
    top: '100%',
    right: padding.L,
    zIndex: 30,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
  },
  commentBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: colors.bgLayerDefault,
    zIndex: 10,
    elevation: 10,
  },
  toastContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 20,
    elevation: 20,
  },
  commentMenuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
  commentMenu: {
    position: 'absolute',
    right: 8,
    zIndex: 1,
    elevation: 101,
  },
  dialogOverlayContent: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: padding.XL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    color: colors.fgNeutralMuted,
  },
  commentDeleteItem: {
    borderRadius: radius.M,
    ...shadow.middleDown
  },
});

export default FeedDetailScreen;