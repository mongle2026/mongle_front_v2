import { useCallback, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { getApiErrorDetail } from '../../../shared/api/client';
import { isSameId, toIdKey } from '../../../shared/utils/id';
import { profileKeys } from '../../profile/api/profileKeys';
import { recipientKeys } from '../../write/recipient/api/recipientKeys';

/*
 * 팔로우/언팔로우.
 * 같은 사람에 대한 요청은 응답이 올 때까지 막고(요청 순서가 뒤바뀌지 않게), 다른 사람 요청은 바로 보낸다.
 * onMutate 에서 화면을 먼저 바꾸고, 실패하면 onError 에서 되돌린다.
 */
export default function useFollow({
  currentUserId,
  onMutate,
  onSuccess,
  onError,
} = {}) {
  const queryClient = useQueryClient();

  // 같은 렌더 안의 연타도 막을 수 있게 ref 로 확인하고, 버튼 표시는 state 로 한다
  const pendingIdsRef = useRef(new Set());
  const [pendingTargetUserIds, setPendingTargetUserIds] = useState(() => new Set());

  const setPending = useCallback((targetUserId, isPending) => {
    const nextIds = new Set(pendingIdsRef.current);

    if (isPending) {
      nextIds.add(toIdKey(targetUserId));
    } else {
      nextIds.delete(toIdKey(targetUserId));
    }

    pendingIdsRef.current = nextIds;
    setPendingTargetUserIds(nextIds);
  }, []);

  // 훅에 건 콜백은 동시에 진행 중인 요청마다 각각 불린다(mutate 에 넘긴 콜백은 마지막 요청만 불린다)
  const { mutate } = useMutation({
    mutationFn: async ({ targetUserId, nextFollowing }) => {
      if (!currentUserId || !targetUserId) {
        throw new Error('팔로우할 사용자 정보가 올바르지 않습니다.');
      }

      const url = `/follow/${targetUserId}`;
      const response = nextFollowing
        ? await apiClient.post(url)
        : await apiClient.delete(url);

      return response.data;
    },

    onMutate: variables => onMutate?.(variables),

    onSuccess: (data, variables) => {
      // 수신인 기본 목록(나 + 팔로잉)이 바뀌므로 지워서, 편지 작성에서 열 때 지난 목록이 잠깐 보이지 않게 한다
      queryClient.removeQueries({ queryKey: recipientKeys.all });

      // 내 팔로우 목록이 바뀌고, 팔로워 목록의 맞팔 여부(isFollowing)도 바뀌므로 두 탭 모두 새로 받게 한다
      queryClient.invalidateQueries({ queryKey: profileKeys.followsAll(currentUserId) });

      onSuccess?.(data, variables);
    },

    onError: (error, variables, context) => {
      console.warn(
        '팔로우 처리에 실패했습니다.',
        getApiErrorDetail(error),
      );

      onError?.(error, variables, context);
    },

    onSettled: (_, __, variables) => {
      setPending(variables.targetUserId, false);
    },
  });

  const toggleFollow = useCallback((targetUserId, isFollowing) => {
    if (
      !targetUserId ||
      isSameId(currentUserId, targetUserId) ||
      pendingIdsRef.current.has(toIdKey(targetUserId))
    ) {
      return;
    }

    setPending(targetUserId, true);

    mutate({
      targetUserId,
      nextFollowing: !isFollowing,
    });
  }, [currentUserId, mutate, setPending]);

  const isTargetPending = useCallback(
    targetUserId => targetUserId != null && pendingTargetUserIds.has(toIdKey(targetUserId)),
    [pendingTargetUserIds],
  );

  return {
    toggleFollow,
    pendingTargetUserIds,
    isTargetPending,
  };
}
