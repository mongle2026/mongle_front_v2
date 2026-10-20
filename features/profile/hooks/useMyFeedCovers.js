import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../shared/api/client';
import { flattenPages, getNextCursor, toCursorPage, withCursor } from '../../../shared/api/cursorPage';
import { hasId } from '../../../shared/utils/id';

import { profileKeys } from '../api/profileKeys';
import { toFeedCover } from '../utils/toFeedCover';

const MY_FEED_COVER_LIMIT = 20;

// 프로필에 보여줄 내가 쓴 피드의 노래 커버 (최신순). 게시글 편집에서 뺀 글은 오지 않는다.
// GET /feed/profile/:publicId?cursor=&limit=  (userId 는 내 publicId)
const useMyFeedCovers = ({ userId }) => {
  const isConfigured = Boolean(isApiConfigured && hasId(userId));

  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: profileKeys.covers(userId),
    enabled: isConfigured,
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.get(`/feed/profile/${userId}`, {
        params: withCursor({ limit: MY_FEED_COVER_LIMIT }, pageParam),
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

export default useMyFeedCovers;
