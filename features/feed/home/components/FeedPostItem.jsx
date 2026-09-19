import React, { memo, useCallback, useMemo } from 'react';

import { getImageSources, resolveMediaUri } from '../../../../shared/utils/media';
import useDoubleTapLike from '../../hooks/useDoubleTapLike';

import PostCard from './PostCard';

const FeedPostItem = ({
  item,
  userId,
  cardStyle,
  likeDisabled = false,
  bookmarkDisabled = false,
  followDisabled = false,
  isMusicPlaying = false,
  onPressPost,
  onPressComment,
  onPressLike,
  onPressBookmark,
  onPressFollow,
  onPressMusicPlayback,
}) => {
  const feedId = item?.feedId;
  const user = item?.user;
  const music = item?.music;
  const record = item?.record;

  // PostCard 안의 이미지 / MusicCard가 매번 다시 그려지지 않도록 같은 값이면 같은 객체를 넘긴다
  const imageSources = useMemo(() => getImageSources(item?.files), [item?.files]);
  const profileImageUri = resolveMediaUri(user?.profileImageUrl);
  const musicArtworkUri = resolveMediaUri(music?.musicArtwork);
  const musicPreviewUri = resolveMediaUri(music?.previewUrl);
  const musicImageSource = useMemo(
    () => (musicArtworkUri ? { uri: musicArtworkUri } : undefined),
    [musicArtworkUri],
  );

  const isMine = Number(user?.userId) === Number(userId);
  const isFollowing = Boolean(user?.isFollowing);
  const isLiked = Boolean(item?.isLiked);
  const isBookmarked = Boolean(item?.isBookmarked);

  const handlePressPost = useCallback(() => {
    onPressPost?.(item);
  }, [item, onPressPost]);

  const handleComment = useCallback(() => {
    onPressComment?.(item);
  }, [item, onPressComment]);

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

  const { likeButtonRef, handleTap } = useDoubleTapLike({
    isLiked,
    disabled: likeDisabled,
    onLike: handleLike,
    onSingleTap: handlePressPost,
  });

  return (
    <PostCard
      onPress={handleTap}
      style={cardStyle}
      font={item?.font}
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
        imageSource: musicImageSource,
        title: music?.musicTitle ?? '',
        artist: music?.musicArtist ?? '',
        isPlaying: isMusicPlaying,
        disabled: !musicPreviewUri,
        onPressPlayback: musicPreviewUri
          ? handleMusicPlayback
          : undefined,
      }}
      content={record?.text ?? ''}
      imageSources={imageSources}
      actionProps={{
        createdAt: item?.createdAt,
        isLiked,
        isBookmarked,
        likeDisabled,
        bookmarkDisabled,
        likeButtonRef,
        onCommentPress: handleComment,
        onLikePress: handleLike,
        onBookmarkPress: handleBookmark,
      }}
    />
  );
};

export default memo(FeedPostItem);