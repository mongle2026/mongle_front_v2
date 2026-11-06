import { useCallback, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import apiClient, { getApiErrorDetail } from '../../../shared/api/client';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import { useGlobalOverlay } from '../../../shared/providers/GlobalOverlayProvider';
import { colors } from '../../../shared/styles/color';
import { toIdKey } from '../../../shared/utils/id';

import { applyBlockState } from '../api/blockCache';

const normalizeUserCode = userCode => String(userCode ?? '').replace(/^@+/, '');

/*
 * 사용자 차단 / 차단 해제.
 * POST /block/:publicId, DELETE /block/:publicId
 * 성공하면 캐시를 맞추고 '@아이디님을 차단했어요.' / '@아이디님의 차단을 해제했어요.' 토스트를 띄운다.
 * 같은 사람에 대한 요청은 응답이 올 때까지 다시 보내지 않는다.
 */
export default function useUserBlock() {
  const queryClient = useQueryClient();
  const { userId } = useCurrentUser();
  const { showToast } = useGlobalOverlay();

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

  // 훅에 건 콜백이라 차단한 화면을 벗어나도 캐시 반영과 토스트는 그대로 된다
  const { mutate } = useMutation({
    mutationFn: async ({ targetUserId, nextBlocked }) => {
      const url = `/block/${targetUserId}`;
      const response = nextBlocked
        ? await apiClient.post(url)
        : await apiClient.delete(url);

      return response.data;
    },

    onSuccess: (_, { targetUserId, nextBlocked, userCode, toastBottomOffset }) => {
      applyBlockState(queryClient, { userId, targetUserId, nextBlocked });

      const displayUserCode = normalizeUserCode(userCode);

      showToast({
        message: nextBlocked
          ? `@${displayUserCode}님을 차단했어요.`
          : `@${displayUserCode}님의 차단을 해제했어요.`,
        icon: 'check',
        iconColor: colors.fgPositiveInverted,
        bottomOffset: toastBottomOffset ?? 0,
      });
    },

    onError: (error, { nextBlocked }) => {
      console.warn(
        nextBlocked ? '차단에 실패했습니다.' : '차단 해제에 실패했습니다.',
        getApiErrorDetail(error),
      );
    },

    onSettled: (_, __, { targetUserId }) => {
      setPending(targetUserId, false);
    },
  });

  const request = useCallback((nextBlocked, { targetUserId, userCode, toastBottomOffset } = {}) => {
    if (
      !userId ||
      !targetUserId ||
      pendingIdsRef.current.has(toIdKey(targetUserId))
    ) {
      return;
    }

    setPending(targetUserId, true);

    mutate({ targetUserId, nextBlocked, userCode, toastBottomOffset });
  }, [mutate, setPending, userId]);

  const blockUser = useCallback(params => request(true, params), [request]);
  const unblockUser = useCallback(params => request(false, params), [request]);

  const isTargetPending = useCallback(
    targetUserId => targetUserId != null && pendingTargetUserIds.has(toIdKey(targetUserId)),
    [pendingTargetUserIds],
  );

  return { blockUser, unblockUser, isTargetPending };
}
