import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../../shared/api/client';

import { archiveKeys } from '../../api/archiveKeys';

const BOOKMARK_FEED_LIMIT = 20;

async function fetchBookmarkFeedPage({ userId, filter, sort, pageParam }) {
  const params = { userId, filter, sort, limit: BOOKMARK_FEED_LIMIT };

  if (pageParam !== null && pageParam !== undefined) {
    params.cursor = pageParam;
  }

  const response = await apiClient.get('/feed/bookmark/me', { params });
  const data = response.data;

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    nextCursor: data?.nextCursor ?? null,
    hasNext: Boolean(data?.hasNext),
  };
}

// 내가 북마크한 글. GET /feed/bookmark/me?userId=&filter=&sort=&cursor=&limit=
// filter: all(전체) / following(팔로우한 사람 글만)
// sort: latest(최근에 북마크한 순) / oldest(오래전에 북마크한 순)
const useBookmarkFeeds = ({ userId, filter = 'all', sort = 'latest' }) => {
  const isConfigured = Boolean(isApiConfigured && Number(userId) > 0);

  const {
    data,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: archiveKeys.bookmarkFeeds(userId, filter, sort),
    initialPageParam: null,
    enabled: isConfigured,
    queryFn: ({ pageParam }) => fetchBookmarkFeedPage({ userId, filter, sort, pageParam }),
    getNextPageParam: lastPage => (lastPage?.hasNext ? lastPage.nextCursor ?? undefined : undefined),
  });

  const feeds = useMemo(() => data?.pages?.flatMap(page => page.items) ?? [], [data?.pages]);

  return {
    feeds,
    isBookmarkFeedsLoading: isConfigured && isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetchBookmarkFeeds: refetch,
  };
};

export default useBookmarkFeeds;
