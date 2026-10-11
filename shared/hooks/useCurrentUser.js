import apiClient, { isApiConfigured } from '../api/client';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '../auth/useAuthStore';
import { resolveMediaUri } from '../utils/media';
import { hasId, toIdKey } from '../utils/id';

export default function useCurrentUser() {
  const sessionUserId = useAuthStore(state => state.session?.userId ?? null);

  const {
    data: currentUser,
  } = useQuery({
    queryKey: [
      'current-user',
      toIdKey(sessionUserId),
    ],

    queryFn: async () => {
      const response = await apiClient.get('/auth/me');

      const user = response.data;

      return {
        userId:
          user.userId,

        userCode:
          user.userCode ?? '',

        nickname:
          user.nickname ?? '',

        hasProfileImage:
          Boolean(
            user.hasProfileImage,
          ),

        profileImageUrl:
          user.profileImageUrl ??
          null,

        profileImageUri:
          resolveMediaUri(
            user.profileImageUrl,
          ),
      };
    },

    enabled:
      isApiConfigured &&
      hasId(sessionUserId),

    staleTime: 5 * 60 * 1000,
  });

  return {
    currentUser,

    /**
     * 사용자 API 조회 전에도
     * 쿼리 키 · 내 글 확인 등에 userId가 필요하기 때문에
     * 로그인할 때 저장한 userId를 fallback으로 사용
     */
    userId:
      currentUser?.userId ??
      sessionUserId,

  };
}
