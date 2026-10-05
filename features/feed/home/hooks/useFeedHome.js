import { useCallback, useEffect, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../../shared/api/client';
import { flattenPages, getNextCursor, withCursor } from '../../../../shared/api/cursorPage';

import useFeedFollow from '../../hooks/useFeedFollow';
import { feedDetailKeys, feedHomeKeys } from '../../api/feedCache';
import { normalizeFeedItem } from '../../api/normalizeFeed';
import { hasId } from '../../../../shared/utils/id';

const FEED_LIMIT = 20;
const FEED_STALE_TIME = 2 * 60 * 1000;
const FEED_GC_TIME = 30 * 60 * 1000;

function normalizeFeedPage(data) {
  const rawItems = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
  const nextCursor = Array.isArray(data) ? null : data?.nextCursor ?? null;
  const hasNext = Array.isArray(data)
    ? false
    : typeof data?.hasNext === 'boolean'
      ? data.hasNext
      : nextCursor !== null && nextCursor !== undefined;

  return {
    items: rawItems.map(normalizeFeedItem).filter(Boolean),
    nextCursor,
    hasNext,
  };
}

async function fetchFeedPage({ userId, feedType, pageParam }) {
  const feedPath = feedType === 'following' ? '/feed/following' : '/feed';
  const params = withCursor({ userId, limit: FEED_LIMIT }, pageParam);
  const response = await apiClient.get(feedPath, { params });
  return normalizeFeedPage(response.data);
}

function createFeedQueryOptions({ userId, feedType, isConfigured }) {
  return {
    queryKey: feedHomeKeys.list(userId, feedType),
    initialPageParam: null,
    enabled: isConfigured,
    queryFn: ({ pageParam }) => fetchFeedPage({ userId, feedType, pageParam }),
    getNextPageParam: getNextCursor,
    staleTime: FEED_STALE_TIME,
    gcTime: FEED_GC_TIME,
  };
}

export default function useFeedHome({ userId, isFollowing = false }) {
  const queryClient = useQueryClient();

  const hasUserId = hasId(userId);
  const isConfigured = Boolean(isApiConfigured && hasUserId);

  const recommendedQueryOptions = useMemo(
    () => createFeedQueryOptions({ userId, feedType: 'recommended', isConfigured }),
    [isConfigured, userId]
  );

  const followingQueryOptions = useMemo(
    () => createFeedQueryOptions({ userId, feedType: 'following', isConfigured }),
    [isConfigured, userId]
  );

  const activeQueryOptions = isFollowing ? followingQueryOptions : recommendedQueryOptions;

  const {
    data,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery(activeQueryOptions);

  // 상세 캐시는 홈 새로고침으로 바뀌지 않아서, 다른 기기에서 고친 글이 상세에서는 예전 내용으로 보인다.
  // 새로고침이 끝나면 상세 캐시를 지워, 상세를 열 때 방금 받은 홈 데이터를 먼저 보여주고 서버에서 다시 받게 한다
  const refetchFeed = useCallback(
    async options => {
      const result = await refetch(options);

      queryClient.removeQueries({
        queryKey: feedDetailKeys.user(userId),
        predicate: query => query.getObserversCount() === 0,
      });

      return result;
    },
    [queryClient, refetch, userId]
  );

  const posts = useMemo(() => flattenPages(data?.pages), [data?.pages]);

  useEffect(() => {
    if (!isConfigured || isFollowing || !data?.pages?.length) return;

    const handle = requestIdleCallback(() => {
      void queryClient.prefetchInfiniteQuery(followingQueryOptions);
    });

    return () => cancelIdleCallback(handle);
  }, [data?.pages?.length, followingQueryOptions, isConfigured, isFollowing, queryClient]);

  // 새로 팔로우하면 팔로잉 피드를 미리 불러온다
  const handleFollowed = useCallback(
    ({ nextFollowing }) => {
      if (nextFollowing) {
        void queryClient.prefetchInfiniteQuery(followingQueryOptions);
      }
    },
    [followingQueryOptions, queryClient]
  );

  const { toggleFollow, pendingTargetUserIds } = useFeedFollow({
    userId,
    onFollowed: handleFollowed,
  });

  const handlePressFollow = useCallback(
    feed => {
      // 사용자 없음·내 글·요청 중 확인은 useFollow 가 한다
      toggleFollow(feed?.user?.userId, Boolean(feed?.user?.isFollowing));
    },
    [toggleFollow]
  );

  return {
    posts,
    error,
    isConfigured,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetchFeed,
    handlePressFollow,
    pendingTargetUserIds,
  };
}