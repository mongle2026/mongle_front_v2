// 신고 대상 종류 (카드 문구, 미리보기 노출 여부를 정할 때 쓴다).
// 값이 신고 API 경로와 같다: POST /report/{feed|comment|letter|user}/:id
export const REPORT_TARGET_TYPE = {
  FEED: 'feed',
  COMMENT: 'comment',
  LETTER: 'letter',
  USER: 'user',
};

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
