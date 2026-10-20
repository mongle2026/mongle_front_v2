import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../shared/api/client';
import { flattenPages, getNextCursor, toCursorPage, withCursor } from '../../../shared/api/cursorPage';
import { hasId } from '../../../shared/utils/id';

import { toFeedCover } from '../utils/toFeedCover';

const PROFILE_FEED_COVER_LIMIT = 20;

// 프로필에 보여줄 피드의 노래 커버 (최신순). 게시글 편집에서 뺀 글은 오지 않는다.
// 내 프로필이면 공개 범위와 상관없이 모두, 다른 사람 프로필이면 서버가 보는 사람 기준으로 거른다
// (전체 공개 + 팔로우 중이면 팔로워 공개).
// GET /feed/profile/:publicId?cursor=&limit=  (ownerId 는 프로필 주인의 publicId)
// queryKey: 내 프로필 profileKeys.covers, 다른 사람 프로필 profileKeys.userCovers
const useProfileFeedCovers = ({ ownerId, queryKey }) => {
  const isConfigured = Boolean(isApiConfigured && hasId(ownerId));

  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey,
    enabled: isConfigured,
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.get(`/feed/profile/${ownerId}`, {
        params: withCursor({ limit: PROFILE_FEED_COVER_LIMIT }, pageParam),
      });
      return toCursorPage(response.data, toFeedCover);
    },
    getNextPageParam: getNextCursor,
  });

  const covers = useMemo(() => flattenPages(data?.pages), [data?.pages]);

  return {
    covers,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  };
};

export default useProfileFeedCovers;
