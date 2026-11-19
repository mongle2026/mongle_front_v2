// 신고 대상 종류 (카드 문구, 미리보기 노출 여부를 정할 때 쓴다).
// 값이 신고 API 경로와 같다: POST /report/{feed|comment|letter|user}/:id
export const REPORT_TARGET_TYPE = {
  FEED: 'feed',
  COMMENT: 'comment',
  LETTER: 'letter',
  USER: 'user',
};

// TargetCard 문구 종류
// REPORT: 신고하기 화면 ('@id님의 피드를 신고해요')
// REPORTER: 신고한 사람이 보는 신고 결과 ('@id님의 피드를 신고했어요')
// REPORTED: 신고당한 사람이 보는 운영정책 안내 ('내가 올린 피드')
export const TARGET_CARD_VARIANT = {
  REPORT: 'report',
  REPORTER: 'reporter',
  REPORTED: 'reported',
};

// 신고당한 사람 카드에서 아이디 없이 '내가 올린 피드'만 보여주는 대상 종류
export const OWN_TARGET_TYPES = [REPORT_TARGET_TYPE.FEED];

// 신고 사유. ETC를 고르면 사유를 직접 입력하는 입력창이 나온다.
// 값은 백엔드 ReportReason 과 같아서 그대로 reason 으로 보낸다
export const REPORT_REASON = {
  SPAM: 'SPAM',
  ABUSE: 'ABUSE',
  SEXUAL: 'SEXUAL',
  PRIVACY: 'PRIVACY',
  COPYRIGHT: 'COPYRIGHT',
  ETC: 'ETC',
};

export const REPORT_REASONS = [
  { key: REPORT_REASON.SPAM, label: '스팸 · 광고' },
  { key: REPORT_REASON.ABUSE, label: '욕설 · 비방 · 혐오 표현' },
  { key: REPORT_REASON.SEXUAL, label: '음란 · 선정적 콘텐츠' },
  { key: REPORT_REASON.PRIVACY, label: '개인정보 노출' },
  { key: REPORT_REASON.COPYRIGHT, label: '저작권 침해' },
  { key: REPORT_REASON.ETC, label: '기타' },
];

export const ETC_REASON_MAX_LENGTH = 200;

// 백엔드 ReportReason('SPAM' 등)을 신고하기 화면과 같은 문구('스팸 · 광고')로 바꾼다.
// 모르는 값이면 받은 값을 그대로 보여준다
export const getReportReasonLabel = reason =>
  REPORT_REASONS.find(item => item.key === reason)?.label ?? reason;

// 백엔드 ReportTargetType('FEED' 등)을 REPORT_TARGET_TYPE('feed' 등)으로 바꾼다. 모르는 값이면 null
export const toReportTargetType = value =>
  Object.values(REPORT_TARGET_TYPE).find(
    type => type === String(value ?? '').toLowerCase(),
  ) ?? null;

// 신고 대상 종류별 처리 결과 · 조치 내용 문구
export const REPORT_ACTION_LABEL = {
  [REPORT_TARGET_TYPE.COMMENT]: '댓글 삭제',
  [REPORT_TARGET_TYPE.FEED]: '피드 가림',
  [REPORT_TARGET_TYPE.LETTER]: '편지 삭제',
  [REPORT_TARGET_TYPE.USER]: '계정 이용 제한',
};

// 신고 결과 안내 화면 종류.
// VIOLATION: 신고한 사람에게 위반 확인 · 조치 안내
// NO_VIOLATION: 신고한 사람에게 위반 없음 안내
// WARNING: 신고당한 사람에게 경고 1회 안내
// SUSPENDED: 신고당한 사람에게 경고 2회로 이용 정지 안내
// SUSPENSION_LIFTED: 이용 정지 해제 안내
export const REPORT_RESULT_TYPE = {
  VIOLATION: 'VIOLATION',
  NO_VIOLATION: 'NO_VIOLATION',
  WARNING: 'WARNING',
  SUSPENDED: 'SUSPENDED',
  SUSPENSION_LIFTED: 'SUSPENSION_LIFTED',
};
