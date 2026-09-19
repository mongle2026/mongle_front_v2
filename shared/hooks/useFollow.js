import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient, { getApiErrorDetail } from '../api/client';

export default function useFollow({
  currentUserId,
  onSuccess,
  onError,
} = {}) {
  const followMutation = useMutation({
    mutationFn: async ({ targetUserId, nextFollowing }) => {
      if (!currentUserId || !targetUserId) {
        throw new Error('팔로우할 사용자 정보가 올바르지 않습니다.');
      }

      if (Number(currentUserId) === Number(targetUserId)) {
        return null;
      }

      const url = `/follow/${targetUserId}`;

      if (nextFollowing) {
        const response = await apiClient.post(url, null, {
          params: { currentUserId },
        });

        return response.data;
      }

      const response = await apiClient.delete(url, {
        params: { currentUserId },
      });

      return response.data;
    },

    onSuccess: (data, variables) => {
      if (!data) return;
      onSuccess?.(data, variables);
    },

    onError: (error, variables) => {
      console.warn(
        '팔로우 처리에 실패했습니다.',
        getApiErrorDetail(error),
      );

      onError?.(error, variables);
    },
  });

  const toggleFollow = useCallback((targetUserId, isFollowing) => {
    if (
      followMutation.isPending ||
      !targetUserId ||
      Number(currentUserId) === Number(targetUserId)
    ) {
      return;
    }

    followMutation.mutate({
      targetUserId,
      nextFollowing: !isFollowing,
    });
  }, [
    currentUserId,
    followMutation.isPending,
    followMutation.mutate,
  ]);

  const pendingTargetUserId = followMutation.isPending
    ? String(followMutation.variables?.targetUserId ?? '')
    : null;

  return {
    toggleFollow,
    isFollowPending: followMutation.isPending,
    pendingTargetUserId,
  };
}