import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');

export default function useFollow({
  currentUserId,
  onSuccess,
  onError,
} = {}) {
  const followMutation = useMutation({
    mutationFn: async ({ targetUserId, nextFollowing }) => {
      if (!API_BASE_URL) {
        throw new Error('EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다.');
      }

      if (!currentUserId || !targetUserId) {
        throw new Error('팔로우할 사용자 정보가 올바르지 않습니다.');
      }

      if (Number(currentUserId) === Number(targetUserId)) {
        return null;
      }

      const url = `${API_BASE_URL}/follow/${targetUserId}`;

      if (nextFollowing) {
        const response = await axios.post(url, null, {
          params: { currentUserId },
        });

        return response.data;
      }

      const response = await axios.delete(url, {
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
        error.response?.data ?? error.message,
      );

      onError?.(error, variables);
    },
  });

  const followUser = useCallback(targetUserId => {
    followMutation.mutate({
      targetUserId,
      nextFollowing: true,
    });
  }, [followMutation.mutate]);

  const unfollowUser = useCallback(targetUserId => {
    followMutation.mutate({
      targetUserId,
      nextFollowing: false,
    });
  }, [followMutation.mutate]);

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
    followUser,
    unfollowUser,
    toggleFollow,
    isFollowPending: followMutation.isPending,
    pendingTargetUserId,
    error: followMutation.error,
  };
}