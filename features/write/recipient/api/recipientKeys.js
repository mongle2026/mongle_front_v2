import { toIdKey } from '../../../../shared/utils/id';

// 수신인 선택 react-query 키. 뒤에 검색어가 붙는다 ('' 이면 나 + 내가 팔로우한 사람)
// → 팔로우/언팔로우 후 recipientKeys.all 을 지워서 다음에 열 때 새로 받는다.

const RECIPIENT_QUERY_ROOT = ['users', 'search'];

export const recipientKeys = {
  all: RECIPIENT_QUERY_ROOT,
  search: userId => [...RECIPIENT_QUERY_ROOT, toIdKey(userId)],
};
