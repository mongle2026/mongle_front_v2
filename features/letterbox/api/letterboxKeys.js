// 편지함 react-query 키.
// 편지 목록과 우표는 모두 ['letterbox', ...] 아래에 둔다
// → 편지 전송 후 letterboxKeys.all 하나만 invalidate 하면 편지함 전체가 갱신된다 (useCreateLetter).

const LETTERBOX_QUERY_ROOT = ['letterbox'];

export const letterboxKeys = {
  all: LETTERBOX_QUERY_ROOT,
  // 편지 목록 (모든 탭)
  letters: userId => [...LETTERBOX_QUERY_ROOT, Number(userId)],
  // 편지 목록 (탭 하나). tab: 'UNREAD' | 'ALL' | ...
  letterList: (userId, tab) => [...LETTERBOX_QUERY_ROOT, Number(userId), tab],
  // 우표 수집 횟수 + 우표 상세 전체
  stamps: userId => [...LETTERBOX_QUERY_ROOT, 'stamp', Number(userId)],
  stampDetail: (userId, stampCode) => [...LETTERBOX_QUERY_ROOT, 'stamp', Number(userId), stampCode],
};

const LETTER_DETAIL_QUERY_ROOT = ['letter-detail'];

export const letterDetailKeys = {
  all: LETTER_DETAIL_QUERY_ROOT,
  detail: (letterId, userId) => [...LETTER_DETAIL_QUERY_ROOT, Number(letterId), Number(userId)],
};
