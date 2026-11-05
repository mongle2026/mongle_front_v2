// 알림 종류 (목록 탭, 이동할 화면을 정할 때 쓴다)
export const NOTIFICATION_TYPE = {
  LETTER: 'letter',
  FEED: 'feed',
  NEWS: 'news',
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
  // 소식: 신고한 사람에게 신고 처리 결과
  REPORT_RESOLVED: 'report_resolved',
  REPORT_REJECTED: 'report_rejected',
  // 소식: 신고당한 사람에게 운영정책 안내
  POLICY_NOTICE: 'policy_notice',
};

// 신고 처리 알림의 대상 종류 (백엔드 ReportTargetType)
export const REPORT_TARGET_TYPE = {
  FEED: 'FEED',
  COMMENT: 'COMMENT',
  LETTER: 'LETTER',
  USER: 'USER',
};
