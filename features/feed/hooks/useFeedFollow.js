import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import useFollow from '../../../shared/hooks/useFollow';
import { syncFollowState } from '../api/feedCache';

/**
 * 피드 화면용 팔로우. 성공하면 피드 홈/상세 캐시의 팔로우 상태를 맞춘다.
 *
 * @param {object} params
 * @param {number} params.userId 현재 사용자
 * @param {(result: { targetUserId, nextFollowing }) => void} [params.onFollowed] 캐시 동기화 후 추가로 할 일
 */
export default function useFeedFollow({ userId, onFollowed }) {
  const queryClient = useQueryClient();

  const handleFollowSuccess = useCallback(
    (_, { targetUserId, nextFollowing }) => {
      syncFollowState(queryClient, { userId, targetUserId, nextFollowing });
      onFollowed?.({ targetUserId, nextFollowing });
    },
    [onFollowed, queryClient, userId],
  );

  return useFollow({
    currentUserId: userId,
    onSuccess: handleFollowSuccess,
  });
}
