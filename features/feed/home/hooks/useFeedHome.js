import { useCallback, useEffect, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../../shared/api/client';
import { flattenPages, getNextCursor, withCursor } from '../../../../shared/api/cursorPage';

import useFeedFollow from '../../hooks/useFeedFollow';
import { feedHomeKeys } from '../../api/feedCache';
import { normalizeFeedItem } from '../../api/normalizeFeed';
import { hasId, isSameId } from '../../../../shared/utils/id';

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
    refetch: refetchFeed,
  } = useInfiniteQuery(activeQueryOptions);

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
      const targetUserId = feed?.user?.userId;
      if (!targetUserId) return;
      if (isSameId(targetUserId, userId)) return;

      toggleFollow(targetUserId, Boolean(feed?.user?.isFollowing));
    },
    [toggleFollow, userId]
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