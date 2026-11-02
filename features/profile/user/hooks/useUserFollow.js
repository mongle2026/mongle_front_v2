import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import useFollow from '../../../feed/hooks/useFollow';
import {
  applyFollowState,
  refreshFollowingFeeds,
  refreshUserCovers,
  revertFollowState,
} from '../../../feed/api/feedCache';

/**
 * 다른 사람 프로필의 팔로우 버튼.
 * 피드 팔로우(useFeedFollow)와 같은 캐시(피드 홈/상세/보관함/이 화면의 팔로우 상태)를 먼저 바꾼다.
 * 팔로우 여부에 따라 보이는 글(팔로워 공개)이 달라지므로 서버 반영 후 커버 그리드를 다시 받는다.
 *
 * @param {object} params
 * @param {string} params.userId 현재 사용자
 */
export default function useUserFollow({ userId }) {
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

      refreshUserCovers(queryClient, { userId, targetUserId });
    },
    [queryClient, userId],
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
