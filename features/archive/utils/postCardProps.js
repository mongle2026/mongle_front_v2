import { getImageSources, resolveMediaUri, toImageSource } from '../../../shared/utils/media';

// 피드 응답 → 보관함 카드(ShortPostCard / OthersPostCard) props.
// 두 카드가 같이 쓰는 본문(음악 커버·제목, 글, 이미지, 날짜)은 여기서 한 번에 만든다.
const toPostCardBase = feed => ({
  feedId: feed.feedId,
  music: {
    imageSource: toImageSource(resolveMediaUri(feed?.music?.musicArtwork)),
    title: feed?.music?.musicTitle ?? '',
  },
  font: feed?.font,
  content: feed?.record?.text ?? '',
  imageSources: getImageSources(feed?.files),
  date: feed?.createdAt,
});

// 내 기록 카드. 텍스트가 있으면 텍스트만, 이미지만 있으면 이미지 개수만큼 보인다 (ShortPostCard 가 텍스트 우선)
export const toShortPost = feed => {
  const base = toPostCardBase(feed);

  return {
    ...base,
    music: {
      ...base.music,
      artist: feed?.music?.musicArtist,
      previewUrl: resolveMediaUri(feed?.music?.previewUrl),
    },
  };
};

// 북마크한 다른 사람 글 카드. 작성자 프로필이 같이 보인다
export const toOthersPost = feed => ({
  ...toPostCardBase(feed),
  profile: {
    imageUri: resolveMediaUri(feed?.user?.profileImageUrl),
    username: feed?.user?.userCode ?? '',
    isFollowing: Boolean(feed?.user?.isFollowing),
  },
});
