import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import useFollow from '../../../shared/hooks/useFollow';
import { applyFollowState, refreshFollowingFeeds, revertFollowState } from '../api/feedCache';

/**
 * 피드 화면용 팔로우. 탭하는 즉시 피드 홈/상세/보관함 캐시의 팔로우 상태를 바꾸고, 실패하면 되돌린다.
 *
 * @param {object} params
 * @param {number} params.userId 현재 사용자
 * @param {(result: { targetUserId, nextFollowing }) => void} [params.onFollowed] 서버 반영 후 추가로 할 일
 */
export default function useFeedFollow({ userId, onFollowed }) {
  const queryClient = useQueryClient();

  const handleMutate = useCallback(
    ({ targetUserId, nextFollowing }) =>
      applyFollowState(queryClient, { userId, targetUserId, nextFollowing }),
    [queryClient, userId],
  );

  const handleSuccess = useCallback(
    (_, { targetUserId, nextFollowing }) => {
      if (nextFollowing) {
        refreshFollowingFeeds(queryClient, { userId });
      }

      onFollowed?.({ targetUserId, nextFollowing });
    },
    [onFollowed, queryClient, userId],
  );

  const handleError = useCallback(
    (_, { targetUserId, nextFollowing }) => {
      revertFollowState(queryClient, { userId, targetUserId, nextFollowing });
    },
    [queryClient, userId],
  );

  return useFollow({
    currentUserId: userId,
    onMutate: handleMutate,
    onSuccess: handleSuccess,
    onError: handleError,
  });
}
