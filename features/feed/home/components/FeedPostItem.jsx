import React, { memo, useCallback } from 'react';

import { getImageSources, resolveMediaUri } from '../../../../shared/utils/media';
import useDoubleTapLike from '../../hooks/useDoubleTapLike';

import PostCard from './PostCard';

const FeedPostItem = ({
  item,
  userId,
  likeDisabled = false,
  bookmarkDisabled = false,
  followDisabled = false,
  isMusicPlaying = false,
  musicPlaybackProgress = 0,
  onPressPost,
  onPressLike,
  onPressBookmark,
  onPressFollow,
  onPressMusicPlayback,
  onSeekMusicPlayback,
}) => {
  const feedId = item?.feedId;
  const user = item?.user;
  const music = item?.music;
  const record = item?.record;

  const imageSources = getImageSources(item?.files);
  const profileImageUri = resolveMediaUri(user?.profileImageUrl);
  const musicArtworkUri = resolveMediaUri(music?.musicArtwork);
  const musicPreviewUri = resolveMediaUri(music?.previewUrl);

  const isMine = Number(user?.userId) === Number(userId);
  const isFollowing = Boolean(user?.isFollowing);
  const isLiked = Boolean(item?.isLiked);
  const isBookmarked = Boolean(item?.isBookmarked);

  const handlePressPost = useCallback(() => {
    onPressPost?.(item);
  }, [item, onPressPost]);

  const handleLike = useCallback(() => {
    onPressLike?.(item);
  }, [item, onPressLike]);

  const handleBookmark = useCallback(() => {
    onPressBookmark?.(item);
  }, [item, onPressBookmark]);

  const handleFollow = useCallback(() => {
    onPressFollow?.(item);
  }, [item, onPressFollow]);

  const handleMusicPlayback = useCallback(() => {
    if (!musicPreviewUri) return;

    onPressMusicPlayback?.({
      feedId,
      previewUrl: musicPreviewUri,
    });
  }, [feedId, musicPreviewUri, onPressMusicPlayback]);

  const handleMusicSeek = useCallback(progress => {
    if (!musicPreviewUri) return;

    onSeekMusicPlayback?.({
      feedId,
      progress,
    });
  }, [feedId, musicPreviewUri, onSeekMusicPlayback]);

  const { likeButtonRef, handleTap } = useDoubleTapLike({
    isLiked,
    disabled: likeDisabled,
    onLike: handleLike,
    onSingleTap: handlePressPost,
  });

  return (
    <PostCard
      onPress={handleTap}
      profileProps={{
        imageUri: profileImageUri,
        username: user?.userCode ?? '',
        showFollowButton: !isMine,
        followLabel: isFollowing ? '팔로잉' : '팔로우',
        followVariant: isFollowing ? 'Ghost' : 'Solid',
        followDisabled,
        onPressFollow: handleFollow,
      }}
      musicProps={{
        imageSource: musicArtworkUri
          ? { uri: musicArtworkUri }
          : undefined,
        title: music?.musicTitle ?? '',
        artist: music?.musicArtist ?? '',
        isPlaying: isMusicPlaying,
        playbackProgress: musicPlaybackProgress,
        disabled: !musicPreviewUri,
        onPressPlayback: musicPreviewUri
          ? handleMusicPlayback
          : undefined,
        onSeekPlayback: musicPreviewUri
          ? handleMusicSeek
          : undefined,
      }}
      content={record?.text ?? ''}
      imageSources={imageSources}
      authorFont={record?.authorFont}
      actionProps={{
        createdAt: item?.createdAt,
        isLiked,
        isBookmarked,
        likeDisabled,
        bookmarkDisabled,
        likeButtonRef,
        onLikePress: handleLike,
        onBookmarkPress: handleBookmark,
      }}
    />
  );
};

export default memo(FeedPostItem);