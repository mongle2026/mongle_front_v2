import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import IcTrash from '../../../assets/icons/ic_trash.svg';
import MusicCard from '../../../shared/components/content/MusicCard';
import TopIconNavigation from '../../../shared/components/navigation/topnavigation/TopIconNavigation';
import Menu from '../../../shared/components/action/menu/Menu';
import Item from '../../../shared/components/action/menu/Item';
import { Dialog } from '../../../shared/components/action/Dialog';
import { useDialog } from '../../../shared/providers/DialogProvider';
import { useGlobalOverlay } from '../../../shared/providers/GlobalOverlayProvider';
import useFeedMusicPlayback from '../../../shared/hooks/useFeedMusicPlayback';
import { useFloatingBottomOffset } from '../../../shared/hooks/useFloatingBottomOffset';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import { colors, shadow } from '../../../shared/styles/color';
import { padding, radius } from '../../../shared/styles/token';
import { getImageSources, resolveMediaUri } from '../../../shared/utils/media';
import ActionBar from '../home/components/ActionBar';
import ProfileBar from '../home/components/ProfileBar';
import useFeedActions from '../hooks/useFeedActions';
import useDoubleTapLike from '../hooks/useDoubleTapLike';
import FeedDetailContent from './components/FeedDetailContent';
import CommentSection from './components/CommentSection';
import CommentBar from './components/CommentBar';
import useFeedDetail from './hooks/useFeedDetail';
import useFeedComments from './hooks/useFeedComments';
import useCommentMenu from './hooks/useCommentMenu';
import useCommentComposer from './hooks/useCommentComposer';

const FeedDetailScreen = ({ navigation, route }) => {
  const { openDialog } = useDialog();
  const { showToast } = useGlobalOverlay();
  const { currentUser, userId } = useCurrentUser();
  const commentBarRef = useRef(null);
  const feedId = route?.params?.feedId;
  const floatingBottomOffset = useFloatingBottomOffset();
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
    commentText,
    setCommentText,
    replyTarget,
    replyFocusRequestKey,
    handleSubmitComment,
    handlePressReply: handleStartReply,
  } = useCommentComposer({
    createComment,
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
  } = useFeedActions({ userId });

  const normalizedFeedId =
    feed?.feedId != null
      ? String(feed.feedId)
      : null;

  const isMine =
    feed != null &&
    Number(feed.user?.userId) === Number(userId);

  const isLikePending =
    normalizedFeedId != null &&
    likePendingFeedIds.has(normalizedFeedId);

  const isBookmarkPending =
    normalizedFeedId != null &&
    bookmarkPendingFeedIds.has(normalizedFeedId);

  const handlePressLike = useCallback(() => {
    if (!feed) return;
    toggleLike(feed);
  }, [feed, toggleLike]);

  const handlePressBookmarkToastButton = useCallback(() => {
    // 북마크 화면 route가 만들어지면 여기에 navigation.navigate 추가
  }, []);

  const handlePressBookmark = useCallback(() => {
    if (!feed) return;

    const isAddingBookmark = !feed.isBookmarked;

    toggleBookmark(feed, {
      onSuccess: () => {
        if (!isAddingBookmark) return;

        showToast({
          message: '기록을 북마크에 추가했습니다.',
          buttonText: '이동',
          onPressButton: handlePressBookmarkToastButton,
          bottomOffset: floatingBottomOffset,
        });
      },
    });
  }, [
    feed,
    floatingBottomOffset,
    handlePressBookmarkToastButton,
    showToast,
    toggleBookmark,
  ]);

  const {
    likeButtonRef,
    handleTap: handleContentTap,
  } = useDoubleTapLike({
    isLiked: Boolean(feed?.isLiked),
    disabled: isLikePending,
    onLike: handlePressLike,
  });

  const {
    playingFeedId,
    playbackProgress,
    handlePressPlayback,
    handleSeekPlayback,
  } = useFeedMusicPlayback({ navigation });

  const handlePressClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handlePressShare = useCallback(() => {
    // 공유 기능 추후 구현
  }, []);

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
    // 수정 기능 추후 구현
  }, []);

  const handlePressDelete = useCallback(() => {
    if (isDeletingFeed) return;

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
  }, [
    deleteFeed,
    isDeletingFeed,
    openDialog,
  ]);

  const handleCommentBarLayout = useCallback(event => {
    const height = event.nativeEvent.layout.height;

    setCommentBarHeight(previousHeight =>
      previousHeight === height
        ? previousHeight
        : height,
    );
  }, []);

  const handleOpenCommentMenu = useCallback((comment, anchor) => {
    setIsFeedMenuOpen(false);
    handlePressCommentMenu(comment, anchor);
  }, [handlePressCommentMenu]);

  const handlePressReply = useCallback(comment => {
    closeCommentMenu();
    handleStartReply(comment);
  }, [
    closeCommentMenu,
    handleStartReply,
  ]);

  const handleScrollBeginDrag = useCallback(() => {
    closeCommentMenu();
    setIsFeedMenuOpen(false);
  }, [closeCommentMenu]);

  if (!feed) {
    return (
      <View style={styles.screen}>
        <SafeAreaView
          edges={['top']}
          style={styles.topSafeArea}
        >
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
  const isFollowing = Boolean(user.isFollowing);
  const isMusicPlaying =
    playingFeedId === normalizedFeedId;

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
          {isMine && isFeedMenuOpen && (
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
        onScrollBeginDrag={handleScrollBeginDrag}
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
              ? { uri: musicArtworkUri }
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
          likeDisabled={isLikePending}
          bookmarkDisabled={isBookmarkPending}
          likeButtonRef={likeButtonRef}
          onLikePress={handlePressLike}
          onBookmarkPress={handlePressBookmark}
        />
        <CommentSection
          comments={comments}
          isLoading={isLoadingComments}
          openCommentMenuId={
            commentMenu?.comment?.commentId ?? null
          }
          onPressMenu={handleOpenCommentMenu}
          onPressReply={handlePressReply}
        />
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
        <CommentBar
          value={commentText}
          onChangeText={setCommentText}
          onSubmit={handleSubmitComment}
          disabled={isCreatingComment}
          profileImageUri={currentUser?.profileImageUri}
          targetUsername={
            replyTarget?.userCode ??
            user.userCode ??
            ''
          }
          focusRequestKey={replyFocusRequestKey}
        />
      </View>
      {commentMenu && (
        <View
          ref={commentMenuOverlayRef}
          collapsable={false}
          style={styles.commentMenuOverlay}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeCommentMenu}
          />
          <View
            onLayout={handleCommentMenuLayout}
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
    ...shadow.middleDown,
  },
});

export default FeedDetailScreen;