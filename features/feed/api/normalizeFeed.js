// 피드 응답 하나를 화면·캐시에서 쓰는 형태로 맞춘다.
// 홈 목록, 상세, 작성 직후 캐시 삽입이 모두 같은 형태를 쓰도록 여기서만 정규화한다.
export function normalizeFeedItem(item) {
  if (!item?.feedId) return null;

  return {
    ...item,
    user: {
      ...(item.user ?? {}),
      isFollowing: Boolean(item?.user?.isFollowing),
    },
    record: item.record ?? {},
    music: item.music ?? null,
    files: Array.isArray(item.files) ? item.files : [],
    isLiked: Boolean(item.isLiked),
    isBookmarked: Boolean(item.isBookmarked),
    likeCount: Number(item.likeCount ?? 0),
    bookmarkCount: Number(item.bookmarkCount ?? 0),
  };
}
