import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import useFollow from '../../../feed/hooks/useFollow';
import { applyFollowState, refreshFollowingFeeds, revertFollowState } from '../../../feed/api/feedCache';

import { profileKeys } from '../../api/profileKeys';

/**
 * 다른 사람 프로필의 팔로우 버튼.
 * 피드 팔로우(useFeedFollow)처럼 피드 홈/상세/보관함 캐시도 함께 바꾸고, 이 화면의 팔로우 상태도 먼저 바꾼다.
 * 팔로우 여부에 따라 보이는 글(팔로워 공개)이 달라지므로 서버 반영 후 커버 그리드를 다시 받는다.
 *
 * @param {object} params
 * @param {string} params.userId 현재 사용자
 */
export default function useUserFollow({ userId }) {
  const queryClient = useQueryClient();

  const writeFollowStatus = useCallback(
    (targetUserId, isFollowing) => {
      queryClient.setQueryData(
        profileKeys.followStatus(userId, targetUserId),
        status => (status ? { ...status, isFollowing } : status),
      );
    },
    [queryClient, userId],
  );

  const handleMutate = useCallback(
    async ({ targetUserId, nextFollowing }) => {
      await queryClient.cancelQueries({ queryKey: profileKeys.followStatus(userId, targetUserId) });
      writeFollowStatus(targetUserId, nextFollowing);

      await applyFollowState(queryClient, { userId, targetUserId, nextFollowing });
    },
    [queryClient, userId, writeFollowStatus],
  );

  const handleSuccess = useCallback(
    (_, { targetUserId, nextFollowing }) => {
      if (nextFollowing) {
        refreshFollowingFeeds(queryClient, { userId });
      }

      queryClient.invalidateQueries({ queryKey: profileKeys.userCovers(userId, targetUserId) });
    },
    [queryClient, userId],
  );

  const handleError = useCallback(
    (_, { targetUserId, nextFollowing }) => {
      writeFollowStatus(targetUserId, !nextFollowing);
      revertFollowState(queryClient, { userId, targetUserId, nextFollowing });
    },
    [queryClient, userId, writeFollowStatus],
  );

  return useFollow({
    currentUserId: userId,
    onMutate: handleMutate,
    onSuccess: handleSuccess,
    onError: handleError,
  });
}
