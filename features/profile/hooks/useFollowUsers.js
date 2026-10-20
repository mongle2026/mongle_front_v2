import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../shared/api/client';
import { flattenPages, getNextCursor, toCursorPage, withCursor } from '../../../shared/api/cursorPage';
import { hasId } from '../../../shared/utils/id';

import { profileKeys } from '../api/profileKeys';

const FOLLOW_USER_LIMIT = 20;

export const FOLLOW_LIST_TYPE = Object.freeze({
  // 내가 팔로우하는 사람
  FOLLOWINGS: 'followings',
  // 나를 팔로우하는 사람
  FOLLOWERS: 'followers',
});

// 내 팔로우 / 팔로워 목록 (최근에 팔로우한 순). 서버는 로그인한 사람 기준으로 준다.
// GET /follow/me/followings | /follow/me/followers ?cursor=&limit=
// item: { id(publicId), userCode, nickname, hasProfileImage, profileImageUrl, isMe, isFollowing }
const useFollowUsers = ({ userId, type }) => {
  const isConfigured = Boolean(isApiConfigured && hasId(userId));

  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: profileKeys.follows(userId, type),
    enabled: isConfigured,
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.get(`/follow/me/${type}`, {
        params: withCursor({ limit: FOLLOW_USER_LIMIT }, pageParam),
      });
      return toCursorPage(response.data);
    },
    getNextPageParam: getNextCursor,
  });

  const users = useMemo(() => flattenPages(data?.pages), [data?.pages]);

  return {
    users,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  };
};

export default useFollowUsers;
