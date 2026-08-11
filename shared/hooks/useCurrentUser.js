import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

import { mockAuth } from '../auth/mockAuth';
import { resolveMediaUri } from '../utils/media';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(
    /\/+$/,
    '',
  );

export default function useCurrentUser() {
  const isConfigured =
    Boolean(API_BASE_URL);

  const isAuthenticated =
    mockAuth.isAuthenticated;

  const mockUserId =
    Number(mockAuth.userId);

  const {
    data: currentUser,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'current-user',
      String(mockUserId),
    ],

    queryFn: async () => {
      const response = await axios.get(
        `${API_BASE_URL}/user/${mockUserId}`,
      );

      const user = response.data;

      return {
        userId:
          Number(user.userId),

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
      isConfigured &&
      isAuthenticated &&
      mockUserId > 0,

    staleTime: 5 * 60 * 1000,
  });

  return {
    currentUser,

    /**
     * 사용자 API 조회 전에도
     * 좋아요/댓글 등에 userId가 필요하기 때문에
     * mockAuth의 ID를 fallback으로 사용
     */
    userId:
      currentUser?.userId ??
      mockUserId,

    isAuthenticated,
    isConfigured,

    isLoadingCurrentUser:
      isLoading,

    isFetchingCurrentUser:
      isFetching,

    isCurrentUserError:
      isError,

    currentUserError:
      error,

    refetchCurrentUser:
      refetch,
  };
}