import { toIdKey } from '../../../shared/utils/id';

// 차단 react-query 키
export const blockKeys = {
  // 내가 차단한 사용자 목록 (커서 페이지네이션)
  list: userId => ['block', 'list', toIdKey(userId)],
};
