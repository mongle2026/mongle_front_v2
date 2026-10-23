// 알림 종류 (목록 탭, 이동할 화면을 정할 때 쓴다)
export const NOTIFICATION_TYPE = {
  LETTER: 'letter',
  FEED: 'feed',
  NEWS: 'news',
  // 밤사이 쌓인 알림 묶음. 어느 탭에도 속하지 않아 '전체' 탭에서만 보인다
  SUMMARY: 'summary',
};

// 알림 세부 상태 (문구, 이동 후 동작을 정할 때 쓴다)
export const NOTIFICATION_STATUS = {
  SEND: 'send',
  RECEIVE: 'receive',
  COMMENT: 'comment',
  REPLY: 'reply',
  SYSTEM: 'system',
  EVENT: 'event',
  FOLLOW: 'follow',
  NIGHT_SUMMARY: 'night_summary',
};
