import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import useFollow from './useFollow';
import useLoginDialog, { LOGIN_DIALOG_DESCRIPTION } from '../../../shared/hooks/useLoginDialog';
import { applyFollowState, refreshFollowingFeeds, revertFollowState } from '../api/feedCache';

/**
 * 피드 화면용 팔로우. 탭하는 즉시 피드 홈/상세/보관함 캐시의 팔로우 상태를 바꾸고, 실패하면 되돌린다.
 * 로그인하지 않았으면 팔로우하지 않고 로그인 안내 Dialog 를 띄운다.
 *
 * @param {object} params
 * @param {number} params.userId 현재 사용자
 * @param {(result: { targetUserId, nextFollowing }) => void} [params.onFollowed] 서버 반영 후 추가로 할 일
 */
export default function useFeedFollow({ userId, onFollowed }) {
  const queryClient = useQueryClient();
  const { requireLogin } = useLoginDialog();

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

  const follow = useFollow({
    currentUserId: userId,
    onMutate: handleMutate,
    onSuccess: handleSuccess,
    onError: handleError,
  });

  const { toggleFollow } = follow;

  const toggleFollowIfSignedIn = useCallback((targetUserId, isFollowing) => {
    if (!requireLogin(LOGIN_DIALOG_DESCRIPTION.FOLLOW)) return;

    toggleFollow(targetUserId, isFollowing);
  }, [requireLogin, toggleFollow]);

  return {
    ...follow,
    toggleFollow: toggleFollowIfSignedIn,
  };
}
