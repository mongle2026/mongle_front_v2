import { useCallback, useEffect, useMemo } from 'react';
import { InteractionManager } from 'react-native';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import useFollow from '../../../../shared/hooks/useFollow';
import { feedHomeKeys, syncFollowState } from './feedHomeCache';

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
      syncFollowState(queryClient, { userId, targetUserId, nextFollowing });

      if (nextFollowing) {
        void queryClient.prefetchInfiniteQuery(followingQueryOptions);
      }
    },
    [followingQueryOptions, queryClient, userId]
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