import { getImageSources, resolveMediaUri } from '../../../../shared/utils/media';

// 피드 응답 → ShortPostCard props
// 텍스트가 있으면 텍스트만, 이미지만 있으면 이미지 개수만큼 보인다 (ShortPostCard 가 텍스트 우선)
export const toShortPost = feed => {
  const artworkUri = resolveMediaUri(feed?.music?.musicArtwork);

  return {
    feedId: feed.feedId,
    music: {
      imageSource: artworkUri ? { uri: artworkUri } : undefined,
      title: feed?.music?.musicTitle,
      artist: feed?.music?.musicArtist,
      previewUrl: resolveMediaUri(feed?.music?.previewUrl),
    },
    font: feed?.font,
    content: feed?.record?.text ?? '',
    imageSources: getImageSources(feed?.files),
    date: feed?.createdAt,
  };
};
