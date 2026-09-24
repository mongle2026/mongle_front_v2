// 보관함 react-query 키.
// 내 기록은 모두 ['archive', 'myfeed', userId, ...] 아래에 둔다
// → 피드 작성/수정/삭제 후 archiveKeys.all 하나만 invalidate 하면 보관함 전체가 갱신된다.

const ARCHIVE_QUERY_ROOT = ['archive'];

export const archiveKeys = {
  all: ARCHIVE_QUERY_ROOT,
  myFeed: userId => [...ARCHIVE_QUERY_ROOT, 'myfeed', Number(userId)],
  // 최근 기록 (limit 개)
  recentMyFeeds: (userId, limit) => [...ARCHIVE_QUERY_ROOT, 'myfeed', Number(userId), 'recent', limit],
  // 장르별 기록 (장르 + 커버 후보)
  myFeedGenres: (userId, limit) => [...ARCHIVE_QUERY_ROOT, 'myfeed', Number(userId), 'genres', limit],
  // 모든 기록의 월 목록 (월 + 커버 후보)
  myFeedMonths: (userId, limit) => [...ARCHIVE_QUERY_ROOT, 'myfeed', Number(userId), 'months', limit],
};
