import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../../../shared/api/client';
import { flattenPages, toCursorPage, withCursor } from '../../../../../shared/api/cursorPage';

import { archiveKeys } from '../../../api/archiveKeys';
import { hasId } from '../../../../../shared/utils/id';

const ALL_FEED_LIMIT = 20;

// older: 커서보다 오래된 글 (최신순) / newer: 커서보다 최근 글 (오래된순으로 받아 뒤집는다)
const DIRECTION = {
  OLDER: 'older',
  NEWER: 'newer',
};

async function fetchAllFeedPage({ userId, keyword, pageParam }) {
  const { direction, cursor } = pageParam;
  const isNewer = direction === DIRECTION.NEWER;
  const params = { userId, limit: ALL_FEED_LIMIT };

  if (keyword) {
    params.keyword = keyword;
  }

  if (isNewer) {
    params.sort = 'oldest';
  }

  const response = await apiClient.get('/feed/me', { params: withCursor(params, cursor) });
  const page = toCursorPage(response.data);

  return {
    ...page,
    direction,
    // 페이지 안에서도 항상 최신순
    items: isNewer ? [...page.items].reverse() : page.items,
  };
}

const isAllMyFeedsConfigured = ({ userId }) => Boolean(isApiConfigured && hasId(userId));

const getAllMyFeedsQueryOptions = ({ userId, anchorMonth, anchorCursor, keyword }) => {
  const isAnchored = Boolean(anchorMonth);

  return {
    queryKey: archiveKeys.allMyFeeds(userId, anchorMonth ?? 'all', keyword),
    initialPageParam: { direction: DIRECTION.OLDER, cursor: isAnchored ? anchorCursor : null },
    queryFn: ({ pageParam }) => fetchAllFeedPage({ userId, keyword, pageParam }),
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
  };
};

// 위쪽(더 최근) 페이지까지 불러온 캐시는 버린다.
// 그대로 두면 다시 그 달로 왔을 때 위쪽 페이지까지 같이 복원돼 그 달이 맨 위에 오지 않는다
export const removeAllMyFeedsWithNewerPages = (queryClient, { userId, anchorMonth, keyword = '' }) => {
  const queryKey = archiveKeys.allMyFeeds(userId, anchorMonth ?? 'all', keyword);
  const data = queryClient.getQueryData(queryKey);

  if (data?.pages?.[0]?.direction === DIRECTION.NEWER) {
    queryClient.removeQueries({ queryKey, exact: true });
  }
};

// 달(또는 전체)을 누르는 순간 첫 페이지를 불러오기 시작해서, 화면이 넘어오는 동안 받아 둔다
export const prefetchAllMyFeeds = (queryClient, { userId, anchorMonth, anchorCursor, keyword = '' }) => {
  if (!isAllMyFeedsConfigured({ userId })) return;

  removeAllMyFeedsWithNewerPages(queryClient, { userId, anchorMonth, keyword });
  void queryClient.prefetchInfiniteQuery(getAllMyFeedsQueryOptions({ userId, anchorMonth, anchorCursor, keyword }));
};

// 모든 기록 (최신순). GET /feed/me?userId=&cursor=&limit=&keyword=
// anchorMonth('YYYY-MM') + anchorCursor(그 달 latestFeedId + 1)를 넘기면 중간 글을 건너뛰고 그 달부터 시작한다.
//   아래로: 더 오래된 글 (fetchNextPage) / 위로: 더 최근 글 (fetchPreviousPage, sort=oldest)
// anchorMonth 가 없으면 가장 최근 글부터 시작하고 위로 불러올 글은 없다.
// keyword 가 있으면 노래 제목 또는 아티스트에 검색어가 포함된 글만 불러온다.
// enabled: false 면 요청하지 않는다 (이동할 달의 커서를 아직 모를 때 등)
const useAllMyFeeds = ({ userId, anchorMonth, anchorCursor, keyword = '', enabled = true }) => {
  const isConfigured = isAllMyFeedsConfigured({ userId }) && enabled;

  const {
    data,
    isFetchingNextPage,
    isFetchingPreviousPage,
    hasNextPage,
    hasPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
  } = useInfiniteQuery({
    ...getAllMyFeedsQueryOptions({ userId, anchorMonth, anchorCursor, keyword }),
    enabled: isConfigured,
  });

  const feeds = useMemo(() => flattenPages(data?.pages), [data?.pages]);

  return {
    feeds,
    isFetchingNextPage,
    isFetchingPreviousPage,
    hasNextPage,
    hasPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
  };
};

export default useAllMyFeeds;
