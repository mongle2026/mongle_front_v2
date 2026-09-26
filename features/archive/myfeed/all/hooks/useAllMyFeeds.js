import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../../../shared/api/client';

import { archiveKeys } from '../../../api/archiveKeys';

const ALL_FEED_LIMIT = 20;

// older: 커서보다 오래된 글 (최신순) / newer: 커서보다 최근 글 (오래된순으로 받아 뒤집는다)
const DIRECTION = {
  OLDER: 'older',
  NEWER: 'newer',
};

async function fetchAllFeedPage({ userId, pageParam }) {
  const { direction, cursor } = pageParam;
  const isNewer = direction === DIRECTION.NEWER;
  const params = { userId, limit: ALL_FEED_LIMIT };

  if (isNewer) {
    params.sort = 'oldest';
  }

  if (cursor !== null && cursor !== undefined) {
    params.cursor = cursor;
  }

  const response = await apiClient.get('/feed/me', { params });
  const data = response.data;
  const items = Array.isArray(data?.items) ? data.items : [];

  return {
    direction,
    // 페이지 안에서도 항상 최신순
    items: isNewer ? [...items].reverse() : items,
    nextCursor: data?.nextCursor ?? null,
    hasNext: Boolean(data?.hasNext),
  };
}

// 모든 기록 (최신순). GET /feed/me?userId=&cursor=&limit=
// anchorMonth('YYYY-MM') + anchorCursor(그 달 latestFeedId + 1)를 넘기면 중간 글을 건너뛰고 그 달부터 시작한다.
//   아래로: 더 오래된 글 (fetchNextPage) / 위로: 더 최근 글 (fetchPreviousPage, sort=oldest)
// anchorMonth 가 없으면 가장 최근 글부터 시작하고 위로 불러올 글은 없다.
// enabled: false 면 요청하지 않는다 (이동할 달의 커서를 아직 모를 때 등)
const useAllMyFeeds = ({ userId, anchorMonth, anchorCursor, enabled = true }) => {
  const isConfigured = Boolean(isApiConfigured && Number(userId) > 0 && enabled);
  const isAnchored = Boolean(anchorMonth);

  const {
    data,
    isPending,
    isFetchingNextPage,
    isFetchingPreviousPage,
    hasNextPage,
    hasPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
  } = useInfiniteQuery({
    queryKey: archiveKeys.allMyFeeds(userId, anchorMonth ?? 'all'),
    initialPageParam: { direction: DIRECTION.OLDER, cursor: isAnchored ? anchorCursor : null },
    enabled: isConfigured,
    // 화면을 떠나거나 다른 달로 이동하면 바로 버린다.
    // 남겨 두면 다시 그 달로 왔을 때 위쪽(더 최근) 페이지까지 같이 복원돼 그 달이 맨 위에 오지 않는다
    gcTime: 0,
    queryFn: ({ pageParam }) => fetchAllFeedPage({ userId, pageParam }),
    getNextPageParam: lastPage => {
      // 아래 끝 = 마지막 older 페이지. newer 페이지는 항상 위에만 붙는다
      if (lastPage.direction !== DIRECTION.OLDER || !lastPage.hasNext) return undefined;
      return { direction: DIRECTION.OLDER, cursor: lastPage.nextCursor };
    },
    getPreviousPageParam: firstPage => {
      if (!isAnchored) return undefined;
      if (firstPage.direction === DIRECTION.NEWER && !firstPage.hasNext) return undefined;

      const newestFeedId = firstPage.items[0]?.feedId;
      if (newestFeedId === undefined) return undefined;

      return { direction: DIRECTION.NEWER, cursor: newestFeedId };
    },
  });

  const feeds = useMemo(() => data?.pages?.flatMap(page => page.items) ?? [], [data?.pages]);

  return {
    feeds,
    isAllFeedsLoading: isConfigured && isPending,
    isFetchingNextPage,
    isFetchingPreviousPage,
    hasNextPage,
    hasPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
  };
};

export default useAllMyFeeds;
