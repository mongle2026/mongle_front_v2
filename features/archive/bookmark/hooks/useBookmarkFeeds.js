import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { flattenPages } from '../../../../shared/api/cursorPage';

import { getBookmarkFeedsQueryOptions, isBookmarkFeedsConfigured } from '../../api/bookmarkFeedsQuery';

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
