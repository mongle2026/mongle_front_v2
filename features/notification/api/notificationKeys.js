// 알림 react-query 키.
// 탭(전체/피드/편지/소식)마다 목록을 따로 받으므로 type 까지 키에 넣는다.
// 새 알림이 오면 notificationKeys.all 하나만 invalidate 하면 모든 탭이 갱신된다.

const NOTIFICATION_QUERY_ROOT = ['notification'];

export const notificationKeys = {
  all: NOTIFICATION_QUERY_ROOT,
  // type: null(전체) | 'feed' | 'letter' | 'news'
  list: (userId, type) => [...NOTIFICATION_QUERY_ROOT, Number(userId), type ?? 'all'],
};
