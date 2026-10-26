import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MusicCard from '../../../shared/components/content/MusicCard';
import ImageViewer from '../../../shared/components/content/ImageViewer';
import { Dialog } from '../../../shared/components/feedback/Dialog';
import { BUTTON_VARIANT } from '../../../shared/components/action/Button';
import { MAIN_TAB_ROUTES } from '../../../shared/components/navigation/bottomnavigation/routeNames';

import IlDialogDeletedfeed from '../../../assets/illustrations/il_dialog_deletedfeed.svg';

import { useDialog } from '../../../shared/providers/DialogProvider';
import { useGlobalOverlay } from '../../../shared/providers/GlobalOverlayProvider';

import useFeedMusicPlayback from '../../../shared/hooks/useFeedMusicPlayback';
import { useKeyboardHeight } from '../../../shared/hooks/useFloatingBottomOffset';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import useLoginDialog, { LOGIN_DIALOG_DESCRIPTION } from '../../../shared/hooks/useLoginDialog';
import useDeletedContentDialog, { isDeletedContentError } from '../../../shared/hooks/useDeletedContentDialog';

import { colors } from '../../../shared/styles/color';
import { normalizeFont } from '../../../shared/styles/fontType';

import { getImageSources, resolveMediaUri, toImageSource } from '../../../shared/utils/media';
import { isEdited } from '../../../shared/utils/dateUtils';
import { shareFeed } from '../utils/shareFeed';

import ActionBar, { DATE_FORMAT } from '../../../shared/components/content/ActionBar';
import ProfileBar from '../components/ProfileBar';

import useFeedActions from '../hooks/useFeedActions';
import useFeedFollow from '../hooks/useFeedFollow';
import useDoubleTapLike from '../hooks/useDoubleTapLike';

import FeedDetailContent from './components/FeedDetailContent';
import CommentSection from './components/CommentSection';
import CommentComposer from './components/CommentComposer';
import KeyboardGapFill from '../../../shared/components/layout/KeyboardGapFill';
import FeedDetailHeader from './components/FeedDetailHeader';
import LoadStateView from '../../../shared/components/feedback/LoadStateView';
import CommentMenuOverlay from './components/CommentMenuOverlay';

import useFeedDetail from './hooks/useFeedDetail';
import useFeedComments from './hooks/useFeedComments';
import useCommentMenu from './hooks/useCommentMenu';
import useCommentComposer from './hooks/useCommentComposer';
import useScrollToComment from './hooks/useScrollToComment';
import useScrollToReplyTarget from './hooks/useScrollToReplyTarget';
import useDeletedCommentToast from './hooks/useDeletedCommentToast';
import { isSameId } from '../../../shared/utils/id';

const FeedDetailScreen = ({ navigation, route }) => {
  const { openDialog } = useDialog();
  const { openOverlay, showToast, hideToast } = useGlobalOverlay();
  const { currentUser, userId } = useCurrentUser();
  const { requireLogin } = useLoginDialog();

  const commentBarRef = useRef(null);

  const feedId = route?.params?.feedId;
  const shouldScrollToComment = Boolean(route?.params?.scrollToComment);
  // 댓글/답글 알림으로 들어왔을 때 그 댓글 id와 답글 여부
  const notifiedCommentId = route?.params?.commentId ?? null;
  const isNotifiedReply = Boolean(route?.params?.isReply);

  const {
    scrollViewRef,
    lockAutoScroll,
    handleCommentSectionLayout,
  } = useScrollToComment({ shouldScrollToComment });

  /*
   * 댓글 입력바 위치.
   * 바는 키보드 높이를 프레임마다 따라가며(useAnimatedKeyboard) 키보드와 한 몸처럼 아래에서 올라온다.
   * 안쪽 아래 여백은 항상 홈 인디케이터만큼 두고, 키보드가 올라오면 그 여백만큼은 키보드 뒤로 겹쳐서
   * 여백이 툭 사라지는 순간 없이 이어지게 한다.
   *
   * keyboardHeight    : 키보드 이벤트로 받은 최종 키보드 높이 (내려가 있으면 0)
   * commentBarBottom  : 키보드가 다 올라왔을 때 바를 화면 아래에서 띄우는 값 (스크롤 여백 · 위치 계산용)
   * commentBarPadding : 바 안쪽 아래 여백 (홈 인디케이터)
   */
  const insets = useSafeAreaInsets();
  // iOS 레이아웃 애니메이션은 끄고, 바 움직임은 아래 keyboard 값으로 직접 그린다
  const keyboardHeight = useKeyboardHeight({ animateLayout: false });
  const keyboard = useAnimatedKeyboard();

  const commentBarPadding = insets.bottom;
  const commentBarBottom = Math.max(keyboardHeight - insets.bottom, 0);

  const commentBarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -Math.max(keyboard.height.value - insets.bottom, 0) },
    ],
  }));

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
        iconColor: colors.fgCriticalInverted,
        bottomOffset: commentBarBottom + commentBarHeight,
      });
    },
  });

  // 알림 등으로 이미 삭제된 피드에 들어오면 내용 없이 안내 Dialog만 띄운다
  const isDeleted = isDeletedContentError(error);

  useDeletedContentDialog({
    navigation,
    isDeleted,
    id: 'feed-deleted-dialog',
    accessibilityLabel: '삭제된 피드 안내',
    renderContent: ({ close }) => (
      <Dialog
        illustration={IlDialogDeletedfeed}
        title="피드를 확인할 수 없어요."
        description="해당 피드는 이미 삭제되었어요."
        cancelText="돌아가기"
        confirmText="피드 둘러보기"
        confirmVariant={BUTTON_VARIANT.SOLID}
        onCancel={() => {
          close();
          navigation.goBack();
        }}
        onConfirm={() => {
          close();
          navigation.popTo('MainTabs', { screen: MAIN_TAB_ROUTES.FEED });
        }}
      />
    ),
  });

  const {
    comments,
    isLoadingComments,
    isCommentsSettled,
    createComment,
    isCreatingComment,
    deleteComment,
    isDeletingComment,
  } = useFeedComments({ feedId, userId, currentUser });

  useDeletedCommentToast({
    commentId: notifiedCommentId,
    isReply: isNotifiedReply,
    comments,
    isCommentsSettled,
    isFeedVisible: Boolean(feed) && !isDeleted,
    bottomOffset: commentBarBottom + commentBarHeight,
    isCommentBarMeasured: commentBarHeight > 0,
  });

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
    revealComment,
  } = useScrollToReplyTarget({
    scrollViewRef,
    requestKey: replyFocusRequestKey,
    isKeyboardVisible: keyboardHeight > 0,
    commentBarHeight,
    commentBarBottom,
  });

  const {
    commentMenu,
    commentMenuOverlayRef,
    closeCommentMenu,
    handlePressCommentMenu,
    handleCommentMenuLayout,
    handlePressDeleteComment,
    refreshCommentMenuPosition,
  } = useCommentMenu({
    commentBarHeight,
    commentBarBottom,
    isKeyboardVisible: keyboardHeight > 0,
    deleteComment,
    isDeletingComment,
  });

  const {
    handlePressLike: toggleLike,
    handlePressBookmark: toggleBookmark,
  } = useFeedActions({
    userId,
    // 토스트를 CommentBar(닫힌/열린 상태 모두) 위로 띄운다.
    floatingBarOffset: commentBarBottom + commentBarHeight,
  });

  const { toggleFollow, isTargetPending } = useFeedFollow({ userId });

  const normalizedFeedId = feed?.feedId != null ? String(feed.feedId) : null;

  const isMine =
    feed != null && isSameId(feed.user?.userId, userId);

  const handlePressFollow = useCallback(() => {
    if (!feed) return;

    // 내 글·요청 중 확인은 useFollow 가 한다
    toggleFollow(feed.user?.userId, Boolean(feed.user?.isFollowing));
  }, [feed, toggleFollow]);

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
        dimStyle: styles.imageViewerDim,
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

  // 로그인하지 않았으면 댓글을 보내지 않고 로그인 안내 Dialog 를 띄운다
  const canSubmitComment = useCallback(
    () => requireLogin(LOGIN_DIALOG_DESCRIPTION.COMMENT),
    [requireLogin],
  );

  const handleCommentBarLayout = useCallback(event => {
    const height = event.nativeEvent.layout.height;

    setCommentBarHeight(previousHeight =>
      previousHeight === height ? previousHeight : height,
    );
  }, []);

  const handleOpenCommentMenu = useCallback(
    (comment, measureAnchor) => {
      setIsFeedMenuOpen(false);

      handlePressCommentMenu(comment, measureAnchor);
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

  const handleScrollContent = useCallback(
    event => {
      handleScroll(event);

      // 메뉴가 열린 채로 스크롤이 움직이면 메뉴가 케밥을 따라가게 한다.
      if (commentMenu) {
        refreshCommentMenuPosition();
      }
    },
    [commentMenu, handleScroll, refreshCommentMenuPosition],
  );

  const handleScrollBeginDrag = useCallback(() => {
    // 사용자가 직접 스크롤을 시작하면 자동 스크롤을 잠근다.
    lockAutoScroll();

    // 직접 스크롤했다면 답글 대상 위치도 더는 따라가지 않는다.
    clearReplyScrollTarget();

    closeCommentMenu();
    setIsFeedMenuOpen(false);
  }, [clearReplyScrollTarget, closeCommentMenu, lockAutoScroll]);

  // 삭제됐으면 캐시에 예전 피드가 남아 있어도 내용을 보여주지 않는다
  if (!feed || isDeleted) {
    return (
      <View style={styles.screen}>
        <FeedDetailHeader
          onPressClose={handlePressClose}
          onPressShare={handlePressShare}
          onPressMore={handlePressMore}
        />

        <LoadStateView
          isLoading={isLoading}
          isConfigured={isConfigured}
          errorMessage={error && !isDeleted ? '기록을 불러오지 못했습니다.' : null}
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
          /* commentBarHeight 에 SafeArea 여백이 이미 포함돼 있습니다. */
          { paddingBottom: commentBarHeight + commentBarBottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onLayout={handleScrollViewLayout}
        onScroll={handleScrollContent}
        scrollEventThrottle={16}
        onScrollBeginDrag={handleScrollBeginDrag}
      >
        <ProfileBar
          imageUri={profileImageUri}
          username={user.userCode ?? ''}
          font={normalizedFont}
          isFollowing={isFollowing}
          showFollowButton={!isMine}
          followDisabled={isTargetPending(user.userId)}
          onPressFollow={handlePressFollow}
        />

        <MusicCard
          imageSource={toImageSource(musicArtworkUri)}
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
          dateFormat={DATE_FORMAT.DATETIME}
          isEdited={isEdited(feed.createdAt, feed.updatedAt)}
          isLiked={Boolean(feed.isLiked)}
          isBookmarked={Boolean(feed.isBookmarked)}
          bookmarkCount={feed.bookmarkCount}
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
            onNewCommentLayout={revealComment}
          />
        </View>
      </ScrollView>

      <Animated.View
        ref={commentBarRef}
        collapsable={false}
        onLayout={handleCommentBarLayout}
        style={[
          styles.commentBarContainer,
          { paddingBottom: commentBarPadding },
          commentBarAnimatedStyle,
        ]}
      >
        <CommentComposer
          onSubmit={handleSubmitComment}
          canSubmit={canSubmitComment}
          onClose={handleCloseComposer}
          disabled={isCreatingComment}
          profileImageUri={currentUser?.profileImageUri}
          targetUsername={replyTarget?.userCode ?? user.userCode ?? ''}
          isReply={!!replyTarget}
          focusRequestKey={replyFocusRequestKey}
        />

        {/* iOS 키보드 둥근 모서리 틈으로 댓글 목록이 비치지 않게 바 배경을 키보드 뒤까지 늘린다 */}
        <KeyboardGapFill height={keyboardHeight} />
      </Animated.View>

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
    backgroundColor: colors.bgSurface,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    width: '100%',
  },

  imageViewerDim: {
    backgroundColor: colors.bgDimmedStrong,
  },

  imageViewerOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  commentBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: colors.bgSurface,
    zIndex: 10,
    elevation: 10,
  },
});

export default FeedDetailScreen;
