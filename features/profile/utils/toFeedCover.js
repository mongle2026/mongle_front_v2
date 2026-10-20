import { resolveMediaUri, toImageSource } from '../../../shared/utils/media';

// 피드 응답 → 프로필 그리드 카드 (노래 커버 + 제목).
// profileHidden: 프로필 게시글 편집에서 뺀 글이면 true (GET /feed/me 에만 의미가 있다)
export const toFeedCover = feed => ({
  feedId: feed.feedId,
  imageSource: toImageSource(resolveMediaUri(feed?.music?.musicArtwork)),
  title: feed?.music?.musicTitle ?? '',
  profileHidden: Boolean(feed?.profileHidden),
});
