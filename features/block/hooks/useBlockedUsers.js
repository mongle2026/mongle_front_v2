import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../shared/api/client';
import { flattenPages, getNextCursor, toCursorPage, withCursor } from '../../../shared/api/cursorPage';
import { hasId } from '../../../shared/utils/id';

import { blockKeys } from '../api/blockKeys';

const BLOCKED_USER_LIMIT = 20;

// 내가 차단한 사용자 목록 (최근에 차단한 순). 서버는 로그인한 사람 기준으로 준다.
// GET /block/me ?cursor=&limit=
// item: { id(publicId), userCode, nickname, hasProfileImage, profileImageUrl, blockedAt }
const useBlockedUsers = ({ userId }) => {
  const isConfigured = Boolean(isApiConfigured && hasId(userId));

  const {
    data,
    isPending,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: blockKeys.list(userId),
    enabled: isConfigured,
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.get('/block/me', {
        params: withCursor({ limit: BLOCKED_USER_LIMIT }, pageParam),
      });
      return toCursorPage(response.data);
    },
    getNextPageParam: getNextCursor,
  });

  const users = useMemo(() => flattenPages(data?.pages), [data?.pages]);

  return {
    users,
    // 첫 페이지를 받기 전에는 빈 화면을 띄우지 않는다
    isLoading: isConfigured && isPending,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  };
};

export default useBlockedUsers;
