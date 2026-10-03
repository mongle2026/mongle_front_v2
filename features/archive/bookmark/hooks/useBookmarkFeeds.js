import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { isApiConfigured } from '../../../../shared/api/client';
import { fetchCursorPage, flattenPages, getNextCursor } from '../../../../shared/api/cursorPage';

import { archiveKeys } from '../../api/archiveKeys';
import { hasId } from '../../../../shared/utils/id';

const BOOKMARK_FEED_LIMIT = 20;

const fetchBookmarkFeedPage = ({ userId, filter, sort, pageParam }) =>
  fetchCursorPage('/feed/bookmark/me', {
    params: { userId, filter, sort, limit: BOOKMARK_FEED_LIMIT },
    cursor: pageParam,
  });

const isBookmarkFeedsConfigured = ({ userId }) => Boolean(isApiConfigured && hasId(userId));

const getBookmarkFeedsQueryOptions = ({ userId, filter, sort }) => ({
  queryKey: archiveKeys.bookmarkFeeds(userId, filter, sort),
  initialPageParam: null,
  queryFn: ({ pageParam }) => fetchBookmarkFeedPage({ userId, filter, sort, pageParam }),
  getNextPageParam: getNextCursor,
});

// 북마크 탭을 열 때 처음 보이는 목록(전체 · 최신순)을 미리 받아 둔다
export const prefetchBookmarkFeeds = (queryClient, { userId, filter = 'all', sort = 'latest' }) => {
  if (!isBookmarkFeedsConfigured({ userId })) return;

  void queryClient.prefetchInfiniteQuery(getBookmarkFeedsQueryOptions({ userId, filter, sort }));
};

// 내가 북마크한 글. GET /feed/bookmark/me?userId=&filter=&sort=&cursor=&limit=
// filter: all(전체) / following(팔로우한 사람 글만)
// sort: latest(최근에 북마크한 순) / oldest(오래전에 북마크한 순)
const useBookmarkFeeds = ({ userId, filter = 'all', sort = 'latest' }) => {
  const isConfigured = isBookmarkFeedsConfigured({ userId });

  const {
    data,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    ...getBookmarkFeedsQueryOptions({ userId, filter, sort }),
    enabled: isConfigured,
  });

  const feeds = useMemo(() => flattenPages(data?.pages), [data?.pages]);

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
