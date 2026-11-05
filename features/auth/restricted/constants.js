// 이의 신청 처리 상태. 백엔드 AppealStatus 와 같은 값이다
export const APPEAL_STATUS = Object.freeze({
  // 검토 중
  PENDING: 'PENDING',
  // 받아들여 이용 제한을 풀었다
  ACCEPTED: 'ACCEPTED',
  // 받아들이지 않았다. 다시 이의 신청할 수 있다
  REJECTED: 'REJECTED',
  // 검토 전에 제한이 먼저 풀리거나 바뀌어서 닫았다
  CLOSED: 'CLOSED',
});

// 이의 신청 결과 푸시의 data.status (백엔드 APPEAL_PUSH_STATUS). 알림 목록에는 없어서 누르면 앱만 연다
export const APPEAL_PUSH_STATUSES = new Set(['appeal_accepted', 'appeal_rejected']);
