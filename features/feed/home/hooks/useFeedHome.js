import { useCallback, useEffect, useMemo } from 'react';
import { InteractionManager } from 'react-native';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import useFollow from '../../../../shared/hooks/useFollow';
import { feedHomeKeys } from './feedHomeCache';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');

const FEED_LIMIT = 20;
const FEED_STALE_TIME = 2 * 60 * 1000;
const FEED_GC_TIME = 30 * 60 * 1000;

function normalizeFeedItem(item) {
  if (!item?.feedId) return null;

  return {
    ...item,
    user: {
      ...(item.user ?? {}),
      isFollowing: Boolean(item?.user?.isFollowing),
    },
    record: item.record ?? {},
    music: item.music ?? null,
    files: Array.isArray(item.files) ? item.files : [],
    isLiked: Boolean(item.isLiked),
    isBookmarked: Boolean(item.isBookmarked),
    likeCount: Number(item.likeCount ?? 0),
    bookmarkCount: Number(item.bookmarkCount ?? 0),
  };
}

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

function updateFollowState(data, targetUserId, nextFollowing) {
  if (!data?.pages) return data;

  const targetId = String(targetUserId);
  let hasChanged = false;

  const nextPages = data.pages.map(page => {
    if (!Array.isArray(page?.items)) return page;

    let pageChanged = false;
    const nextItems = page.items.map(item => {
      if (String(item?.user?.userId) !== targetId) return item;
      if (Boolean(item?.user?.isFollowing) === nextFollowing) return item;

      hasChanged = true;
      pageChanged = true;

      return {
        ...item,
        user: { ...item.user, isFollowing: nextFollowing },
      };
    });

    return pageChanged ? { ...page, items: nextItems } : page;
  });

  return hasChanged ? { ...data, pages: nextPages } : data;
}

function removeUserFromFeed(data, targetUserId) {
  if (!data?.pages) return data;

  const targetId = String(targetUserId);
  let hasChanged = false;

  const nextPages = data.pages.map(page => {
    if (!Array.isArray(page?.items)) return page;

    const nextItems = page.items.filter(item => {
      const shouldRemove = String(item?.user?.userId) === targetId;
      if (shouldRemove) hasChanged = true;
      return !shouldRemove;
    });

    return nextItems.length === page.items.length ? page : { ...page, items: nextItems };
  });

  return hasChanged ? { ...data, pages: nextPages } : data;
}

async function fetchFeedPage({ userId, feedType, pageParam }) {
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다.');
  }

  const feedPath = feedType === 'following' ? '/feed/following' : '/feed';
  const params = { userId, limit: FEED_LIMIT };

  if (pageParam !== null && pageParam !== undefined) {
    params.cursor = pageParam;
  }

  const response = await axios.get(`${API_BASE_URL}${feedPath}`, { params });
  return normalizeFeedPage(response.data);
}

function createFeedQueryOptions({ userId, feedType, isConfigured }) {
  return {
    queryKey: feedHomeKeys.list(userId, feedType),
    initialPageParam: null,
    enabled: isConfigured,
    queryFn: ({ pageParam }) => fetchFeedPage({ userId, feedType, pageParam }),
    getNextPageParam: lastPage => (lastPage?.hasNext ? lastPage.nextCursor ?? undefined : undefined),
    staleTime: FEED_STALE_TIME,
    gcTime: FEED_GC_TIME,
  };
}

export default function useFeedHome({ userId, isFollowing = false }) {
  const queryClient = useQueryClient();

  const hasUserId = userId !== null && userId !== undefined;
  const isConfigured = Boolean(API_BASE_URL && hasUserId);

  const recommendedQueryOptions = useMemo(
    () => createFeedQueryOptions({ userId, feedType: 'recommended', isConfigured }),
    [isConfigured, userId]
  );

  const followingQueryOptions = useMemo(
    () => createFeedQueryOptions({ userId, feedType: 'following', isConfigured }),
    [isConfigured, userId]
  );

  const recommendedQueryKey = recommendedQueryOptions.queryKey;
  const followingQueryKey = followingQueryOptions.queryKey;
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

  const posts = useMemo(() => data?.pages?.flatMap(page => page.items) ?? [], [data?.pages]);

  useEffect(() => {
    if (!isConfigured || isFollowing || !data?.pages?.length) return;

    const task = InteractionManager.runAfterInteractions(() => {
      void queryClient.prefetchInfiniteQuery(followingQueryOptions);
    });

    return () => task.cancel();
  }, [data?.pages?.length, followingQueryOptions, isConfigured, isFollowing, queryClient]);

  const handleFollowSuccess = useCallback(
    (_, { targetUserId, nextFollowing }) => {
      queryClient.setQueryData(recommendedQueryKey, currentData =>
        updateFollowState(currentData, targetUserId, nextFollowing)
      );

      if (!nextFollowing) {
        queryClient.setQueryData(followingQueryKey, currentData =>
          removeUserFromFeed(currentData, targetUserId)
        );
        return;
      }

      queryClient.invalidateQueries({ queryKey: followingQueryKey, refetchType: 'none' });
      void queryClient.prefetchInfiniteQuery(followingQueryOptions);
    },
    [followingQueryKey, followingQueryOptions, queryClient, recommendedQueryKey]
  );

  const { toggleFollow, pendingTargetUserId } = useFollow({
    currentUserId: userId,
    onSuccess: handleFollowSuccess,
  });

  const handlePressFollow = useCallback(
    feed => {
      const targetUserId = feed?.user?.userId;
      if (!targetUserId) return;
      if (String(targetUserId) === String(userId)) return;

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
    pendingTargetUserId,
  };
}