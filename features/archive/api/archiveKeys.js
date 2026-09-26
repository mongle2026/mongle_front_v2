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
  // 선택한 장르의 기록 목록 (커서 페이지네이션, 정렬별로 따로 캐시)
  genreFeeds: (userId, genre, sort) => [...ARCHIVE_QUERY_ROOT, 'myfeed', Number(userId), 'genre', genre, sort],
  // 모든 기록의 월 목록 (월 + 커버 후보)
  myFeedMonths: (userId, limit) => [...ARCHIVE_QUERY_ROOT, 'myfeed', Number(userId), 'months', limit],
  // 모든 기록 목록 (양방향 커서 페이지네이션). anchorMonth: 목록을 시작한 달 'YYYY-MM' 또는 'all'(가장 최근 글부터)
  allMyFeeds: (userId, anchorMonth) => [...ARCHIVE_QUERY_ROOT, 'myfeed', Number(userId), 'all', anchorMonth],
};
