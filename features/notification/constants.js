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
  // 소식: 이의 신청한 사람에게 이의 신청 결과
  APPEAL_ACCEPTED: 'appeal_accepted',
  APPEAL_REJECTED: 'appeal_rejected',
  // 소식: 이용 정지 기간이 끝난 사람에게 이용 정지 해제 안내
  RESTRICTION_EXPIRED: 'restriction_expired',
};

// 신고 처리 알림의 대상 종류 (백엔드 ReportTargetType)
export const REPORT_TARGET_TYPE = {
  FEED: 'FEED',
  COMMENT: 'COMMENT',
  LETTER: 'LETTER',
  USER: 'USER',
};

// 운영정책 안내(policy_notice)의 제재 내용 (백엔드 SanctionNotice)
export const SANCTION_NOTICE = {
  // 경고 1회
  WARNING: 'WARNING',
  // 경고 2회로 7일 이용 정지
  SUSPENSION: 'SUSPENSION',
  // 영구 정지
  PERMANENT: 'PERMANENT',
};
