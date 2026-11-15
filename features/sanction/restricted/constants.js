// 이의 신청 처리 상태. 백엔드 AppealStatus 와 같은 값이다
export const APPEAL_STATUS = Object.freeze({
  // 검토 중
  PENDING: 'PENDING',
  // 받아들여 이용 제한을 풀었다
  ACCEPTED: 'ACCEPTED',
  // 받아들이지 않았다. 제한이 유지되고 다시 이의 신청할 수 없다
  REJECTED: 'REJECTED',
  // 검토 전에 제한이 먼저 풀리거나 바뀌어서 닫았다
  CLOSED: 'CLOSED',
});

// 이용 제한이 풀린 이유. 백엔드 RestrictionLiftReason 과 같은 값이다.
// 풀린 뒤 앱에 처음 들어올 때 해제 안내 화면(RestrictionLiftedScreen)에서 문구를 고른다
export const RESTRICTION_LIFT_REASON = Object.freeze({
  // 이의 신청이 받아들여졌다
  APPEAL_ACCEPTED: 'APPEAL_ACCEPTED',
  // 운영자가 신고 처리를 되돌렸다
  REVOKED: 'REVOKED',
  // 제한 기간이 끝났다
  EXPIRED: 'EXPIRED',
});

// 이의 신청 결과 푸시의 data.status (백엔드 APPEAL_PUSH_STATUS). 알림 목록에는 없어서 누르면 앱만 연다
export const APPEAL_PUSH_STATUSES = new Set(['appeal_accepted', 'appeal_rejected']);
