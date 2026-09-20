import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import MusicCard from '../../../shared/components/content/MusicCard';
import ImageViewer from '../../../shared/components/content/ImageViewer';
import { Dialog } from '../../../shared/components/action/Dialog';

import { useDialog } from '../../../shared/providers/DialogProvider';
import { useGlobalOverlay } from '../../../shared/providers/GlobalOverlayProvider';

import useFeedMusicPlayback from '../../../shared/hooks/useFeedMusicPlayback';
import {
  useFloatingBottomOffset,
  useKeyboardHeight,
} from '../../../shared/hooks/useFloatingBottomOffset';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';

import { colors } from '../../../shared/styles/color';
import { normalizeFont } from '../../../shared/styles/fontType';

import { getImageSources, resolveMediaUri } from '../../../shared/utils/media';
import { shareFeed } from '../../../shared/utils/shareFeed';

import ActionBar from '../../../shared/components/content/ActionBar';
import ProfileBar from '../components/ProfileBar';

import useFeedActions from '../hooks/useFeedActions';
import useFeedFollow from '../hooks/useFeedFollow';
import useDoubleTapLike from '../hooks/useDoubleTapLike';

import FeedDetailContent from './components/FeedDetailContent';
import CommentSection from './components/CommentSection';
import CommentComposer from './components/CommentComposer';
import FeedDetailHeader from './components/FeedDetailHeader';
import FeedDetailStateView from './components/FeedDetailStateView';
import CommentMenuOverlay from './components/CommentMenuOverlay';

import useFeedDetail from './hooks/useFeedDetail';
import useFeedComments from './hooks/useFeedComments';
import useCommentMenu from './hooks/useCommentMenu';
import useCommentComposer from './hooks/useCommentComposer';
import useScrollToComment from './hooks/useScrollToComment';
import useScrollToReplyTarget from './hooks/useScrollToReplyTarget';

const FeedDetailScreen = ({ navigation, route }) => {
  const { openDialog } = useDialog();
  const { openOverlay, showToast, hideToast } = useGlobalOverlay();
  const { currentUser, userId } = useCurrentUser();

  const commentBarRef = useRef(null);

  const feedId = route?.params?.feedId;
  const shouldScrollToComment = Boolean(route?.params?.scrollToComment);

  const {
    scrollViewRef,
    lockAutoScroll,
    handleCommentSectionLayout,
  } = useScrollToComment({ shouldScrollToComment });

  const floatingBottomOffset = useFloatingBottomOffset();
  const keyboardHeight = useKeyboardHeight();

  const [isFeedMenuOpen, setIsFeedMenuOpen] = useState(false);
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
    onDeleteError: () => {
      showToast({
        message: '기록을 삭제하지 못했습니다.',
        icon: 'alert',
        iconColor: colors.fgCritical,
        bottomOffset: floatingBottomOffset + commentBarHeight,
      });
    },
  });

  const {
    comments,
    isLoadingComments,
    createComment,
    isCreatingComment,
    deleteComment,
    isDeletingComment,
  } = useFeedComments({ feedId, userId });

  const {
    replyTarget,
    replyFocusRequestKey,
    handleSubmitComment,
    handlePressReply: handleStartReply,
    clearReplyTarget,
  } = useCommentComposer({ createComment });

  const {
    handleScroll,
    handleScrollViewLayout,
    setReplyScrollTarget,
    clearReplyScrollTarget,
  } = useScrollToReplyTarget({
    scrollViewRef,
    commentBarRef,
    requestKey: replyFocusRequestKey,
    isKeyboardVisible: keyboardHeight > 0,
    commentBarHeight,
  });

  const {
    commentMenu,
    commentMenuOverlayRef,
    closeCommentMenu,
    handlePressCommentMenu,
    handleCommentMenuLayout,
    handlePressDeleteComment,
  } = useCommentMenu({
    commentBarRef,
    commentBarHeight,
    floatingBottomOffset,
    deleteComment,
    isDeletingComment,
  });

  const {
    handlePressLike: toggleLike,
    handlePressBookmark: toggleBookmark,
    likePendingFeedIds,
    bookmarkPendingFeedIds,
  } = useFeedActions({
    userId,
    // 토스트를 CommentBar(닫힌/열린 상태 모두) 위로 띄운다.
    toastBottomOffset: commentBarHeight,
  });

  const { toggleFollow, isFollowPending } = useFeedFollow({ userId });

  const normalizedFeedId = feed?.feedId != null ? String(feed.feedId) : null;

  const isMine =
    feed != null && Number(feed.user?.userId) === Number(userId);

  const isLikePending =
    normalizedFeedId != null && likePendingFeedIds.has(normalizedFeedId);

  const isBookmarkPending =
    normalizedFeedId != null && bookmarkPendingFeedIds.has(normalizedFeedId);

  const handlePressFollow = useCallback(() => {
    if (!feed || isMine) return;

    toggleFollow(feed.user?.userId, Boolean(feed.user?.isFollowing));
  }, [feed, isMine, toggleFollow]);

  const handlePressLike = useCallback(() => {
    if (!feed) return;

    toggleLike(feed);
  }, [feed, toggleLike]);

  const handlePressBookmark = useCallback(() => {
    if (!feed) return;

    toggleBookmark(feed);
  }, [feed, toggleBookmark]);

  const handlePressImage = useCallback(
    imageSource => {
      closeCommentMenu();
      setIsFeedMenuOpen(false);
      hideToast();

      openOverlay({
        id: 'feed-detail-image-viewer',
        showDim: true,
        closeOnDimPress: true,
        closeOnBackPress: true,
        accessibilityLabel: '사진 크게 보기 닫기',
        contentContainerStyle: styles.imageViewerOverlay,
        renderContent: () => <ImageViewer imageSource={imageSource} />,
      });
    },
    [closeCommentMenu, hideToast, openOverlay],
  );

  const {
    likeButtonRef,
    handleTap: handleContentTap,
  } = useDoubleTapLike({
    isLiked: Boolean(feed?.isLiked),
    disabled: isLikePending,
    onLike: handlePressLike,
  });

  const { playingFeedId, handlePressPlayback } = useFeedMusicPlayback({
    navigation,
  });

  const handlePressClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handlePressShare = useCallback(() => {
    if (!feed) return;

    closeCommentMenu();
    setIsFeedMenuOpen(false);
    hideToast();

    void shareFeed(feed);
  }, [closeCommentMenu, feed, hideToast]);

  const handlePressMore = useCallback(() => {
    closeCommentMenu();

    if (!isMine) {
      setIsFeedMenuOpen(false);

      return;
    }

    setIsFeedMenuOpen(previous => !previous);
  }, [closeCommentMenu, isMine]);

  const handlePressEdit = useCallback(() => {
    setIsFeedMenuOpen(false);

    navigation.navigate('RecordEdit', { feedId });
  }, [feedId, navigation]);

  const handlePressDelete = useCallback(() => {
    if (isDeletingFeed) {
      return;
    }

    setIsFeedMenuOpen(false);

    openDialog({
      id: 'feed-delete-dialog',
      closeOnDimPress: true,
      closeOnBackPress: true,
      accessibilityLabel: '삭제 확인 창 닫기',
      renderContent: ({ close }) => (
        <Dialog
          title="기록을 삭제하시겠어요?"
          description="삭제한 기록은 다시 복구할 수 없어요."
          cancelText="닫기"
          confirmText="삭제"
          onCancel={close}
          onConfirm={() => {
            close();
            deleteFeed();
          }}
        />
      ),
    });
  }, [deleteFeed, isDeletingFeed, openDialog]);

  const handleCommentBarLayout = useCallback(event => {
    const height = event.nativeEvent.layout.height;

    setCommentBarHeight(previousHeight =>
      previousHeight === height ? previousHeight : height,
    );
  }, []);

  const handleOpenCommentMenu = useCallback(
    (comment, anchor) => {
      setIsFeedMenuOpen(false);

      handlePressCommentMenu(comment, anchor);
    },
    [handlePressCommentMenu],
  );

  const handlePressReply = useCallback(
    (replyTarget, commentRef) => {
      closeCommentMenu();

      // 알림으로 들어왔을 때의 자동 스크롤이 뒤늦게 끼어들지 않게 막는다.
      lockAutoScroll();

      // 키보드가 올라오면 이 댓글이 가리지 않게 스크롤을 맞춘다.
      setReplyScrollTarget(commentRef);

      handleStartReply(replyTarget);
    },
    [closeCommentMenu, handleStartReply, lockAutoScroll, setReplyScrollTarget],
  );

  // 입력창이 닫히면 답글 대상 위치도 함께 잊는다.
  const handleCloseComposer = useCallback(() => {
    clearReplyTarget();
    clearReplyScrollTarget();
  }, [clearReplyScrollTarget, clearReplyTarget]);

  const handleScrollBeginDrag = useCallback(() => {
    // 사용자가 직접 스크롤을 시작하면 자동 스크롤을 잠근다.
    lockAutoScroll();

    // 직접 스크롤했다면 답글 대상 위치도 더는 따라가지 않는다.
    clearReplyScrollTarget();

    closeCommentMenu();
    setIsFeedMenuOpen(false);
  }, [clearReplyScrollTarget, closeCommentMenu, lockAutoScroll]);

  if (!feed) {
    return (
      <View style={styles.screen}>
        <FeedDetailHeader
          onPressClose={handlePressClose}
          onPressShare={handlePressShare}
          onPressMore={handlePressMore}
        />

        <FeedDetailStateView
          isLoading={isLoading}
          isConfigured={isConfigured}
          error={error}
        />
      </View>
    );
  }

  const user = feed.user ?? {};
  const music = feed.music ?? {};
  const record = feed.record ?? {};

  const normalizedFont = normalizeFont(feed.font);
  const imageSources = getImageSources(feed.files);

  const profileImageUri = resolveMediaUri(user.profileImageUrl);
  const musicArtworkUri = resolveMediaUri(music.musicArtwork);
  const musicPreviewUri = resolveMediaUri(music.previewUrl);

  const isFollowing = Boolean(user.isFollowing);
  const isMusicPlaying = playingFeedId === normalizedFeedId;

  const handleMusicPlayback = () => {
    if (!musicPreviewUri) {
      return;
    }

    handlePressPlayback({
      feedId: feed.feedId,
      previewUrl: musicPreviewUri,
    });
  };

  return (
    <View style={styles.screen}>
      <FeedDetailHeader
        onPressClose={handlePressClose}
        onPressShare={handlePressShare}
        onPressMore={handlePressMore}
        isMenuOpen={isMine && isFeedMenuOpen}
        onPressEdit={handlePressEdit}
        onPressDelete={handlePressDelete}
        deleteDisabled={isDeletingFeed}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: commentBarHeight + floatingBottomOffset },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onLayout={handleScrollViewLayout}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={handleScrollBeginDrag}
      >
        <ProfileBar
          imageUri={profileImageUri}
          username={user.userCode ?? ''}
          font={normalizedFont}
          showFollowButton={!isMine}
          followLabel={isFollowing ? '팔로잉' : '팔로우'}
          followVariant={isFollowing ? 'Ghost' : 'Solid'}
          followDisabled={isFollowPending}
          onPressFollow={handlePressFollow}
        />

        <MusicCard
          imageSource={musicArtworkUri ? { uri: musicArtworkUri } : undefined}
          title={music.musicTitle ?? ''}
          artist={music.musicArtist ?? ''}
          font={normalizedFont}
          isPlaying={isMusicPlaying}
          disabled={!musicPreviewUri}
          onPressPlayback={musicPreviewUri ? handleMusicPlayback : undefined}
        />

        <FeedDetailContent
          content={record.text ?? ''}
          imageSources={imageSources}
          font={normalizedFont}
          onPress={handleContentTap}
          onPressImage={handlePressImage}
        />

        <ActionBar
          createdAt={feed.createdAt}
          isLiked={Boolean(feed.isLiked)}
          isBookmarked={Boolean(feed.isBookmarked)}
          bookmarkCount={feed.bookmarkCount}
          likeDisabled={isLikePending}
          bookmarkDisabled={isBookmarkPending}
          showCommentButton={false}
          likeButtonRef={likeButtonRef}
          onLikePress={handlePressLike}
          onBookmarkPress={handlePressBookmark}
        />

        <View onLayout={handleCommentSectionLayout}>
          <CommentSection
            comments={comments}
            isLoading={isLoadingComments}
            openCommentMenuId={commentMenu?.comment?.commentId ?? null}
            onPressMenu={handleOpenCommentMenu}
            onPressReply={handlePressReply}
          />
        </View>
      </ScrollView>

      <View
        ref={commentBarRef}
        collapsable={false}
        onLayout={handleCommentBarLayout}
        style={[
          styles.commentBarContainer,
          { bottom: floatingBottomOffset },
        ]}
      >
        <CommentComposer
          onSubmit={handleSubmitComment}
          onClose={handleCloseComposer}
          disabled={isCreatingComment}
          profileImageUri={currentUser?.profileImageUri}
          targetUsername={replyTarget?.userCode ?? user.userCode ?? ''}
          focusRequestKey={replyFocusRequestKey}
        />
      </View>

      {commentMenu && (
        <CommentMenuOverlay
          ref={commentMenuOverlayRef}
          menu={commentMenu}
          onClose={closeCommentMenu}
          onMenuLayout={handleCommentMenuLayout}
          onPressDelete={handlePressDeleteComment}
          deleteDisabled={isDeletingComment}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgLayerDefault,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    width: '100%',
  },

  imageViewerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
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
});

export default FeedDetailScreen;
