import { useCallback, useEffect, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../../shared/api/client';
import { flattenPages, getNextCursor, withCursor } from '../../../../shared/api/cursorPage';

import useFeedFollow from '../../hooks/useFeedFollow';
import { feedDetailKeys, feedHomeKeys } from '../../api/feedCache';
import { normalizeFeedItem } from '../../api/normalizeFeed';
import { hasId } from '../../../../shared/utils/id';
import { FEED_PATH_BY_TAB, FEED_TAB } from '../../constants';

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

async function fetchFeedPage({ feedType, pageParam }) {
  const feedPath = FEED_PATH_BY_TAB[feedType];
  const params = withCursor({ limit: FEED_LIMIT }, pageParam);
  const response = await apiClient.get(feedPath, { params });
  return normalizeFeedPage(response.data);
}

/*
 * 추천 목록은 처음부터 다시 받으면 순서가 새로 섞이고 이미 본 글이 빠진다 (서버가 내려준 글을 기억한다).
 * 그래서 저절로 다시 받지 않고, 당겨서 새로고침할 때만 첫 페이지부터 새로 받는다
 */
const RECOMMENDED_QUERY_OPTIONS = {
  staleTime: Infinity,
  refetchOnReconnect: false,
};

function createFeedQueryOptions({ userId, feedType, enabled }) {
  return {
    queryKey: feedHomeKeys.list(userId, feedType),
    initialPageParam: null,
    enabled,
    queryFn: ({ pageParam }) => fetchFeedPage({ feedType, pageParam }),
    getNextPageParam: getNextCursor,
    staleTime: FEED_STALE_TIME,
    gcTime: FEED_GC_TIME,
    ...(feedType === FEED_TAB.RECOMMENDED ? RECOMMENDED_QUERY_OPTIONS : {}),
  };
}

// 받아 둔 페이지를 첫 페이지만 남긴다. 다시 받을 때 페이지 수만큼 요청하지 않고 첫 페이지부터 새로 받게 한다
const keepFirstPage = data =>
  data?.pages?.length > 1
    ? { pages: data.pages.slice(0, 1), pageParams: data.pageParams.slice(0, 1) }
    : data;

// 추천 · 최신 · 팔로잉 목록 하나. 탭을 오가도 각자 자기 목록을 그대로 들고 있는다
// resetPagesOnRefresh: 다시 받을 때 첫 페이지만 남기고 받는다 (추천)
function useFeedList({ userId, queryOptions, resetPagesOnRefresh = false }) {
  const queryClient = useQueryClient();

  const {
    data,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery(queryOptions);

  // 상세 캐시는 홈 새로고침으로 바뀌지 않아서, 다른 기기에서 고친 글이 상세에서는 예전 내용으로 보인다.
  // 새로고침이 끝나면 상세 캐시를 지워, 상세를 열 때 방금 받은 홈 데이터를 먼저 보여주고 서버에서 다시 받게 한다
  const { queryKey, enabled } = queryOptions;

  const refetchList = useCallback(
    options => {
      if (resetPagesOnRefresh) queryClient.setQueryData(queryKey, keepFirstPage);
      return refetch(options);
    },
    [queryClient, queryKey, refetch, resetPagesOnRefresh]
  );

  const refetchFeed = useCallback(
    async options => {
      const result = await refetchList(options);

      queryClient.removeQueries({
        queryKey: feedDetailKeys.user(userId),
        predicate: query => query.getObserversCount() === 0,
      });

      return result;
    },
    [queryClient, refetchList, userId]
  );

  // 팔로우처럼 목록이 바뀌는 일이 생기면 캐시만 '다시 받아야 함'으로 표시해 둔다(refetchType: 'none').
  // 탭을 바꿔도 목록을 새로 받지 않으니, 그 탭으로 돌아올 때 표시된 목록만 다시 받는다
  const refetchIfInvalidated = useCallback(() => {
    if (!enabled) return;
    if (!queryClient.getQueryState(queryKey)?.isInvalidated) return;

    void refetchList();
  }, [enabled, queryClient, queryKey, refetchList]);

  const posts = useMemo(() => flattenPages(data?.pages), [data?.pages]);

  return useMemo(
    () => ({
      posts,
      pageCount: data?.pages?.length ?? 0,
      error,
      isLoading,
      isFetchingNextPage,
      hasNextPage,
      fetchNextPage,
      refetchFeed,
      refetchIfInvalidated,
    }),
    [
      data?.pages?.length,
      error,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      isLoading,
      posts,
      refetchFeed,
      refetchIfInvalidated,
    ]
  );
}

/**
 * 피드 홈의 추천 · 최신 · 팔로잉 목록.
 * @param {object} params
 * @param {string|number} [params.userId]
 * @param {boolean} [params.loadLatest] 최신 탭을 한 번이라도 열었는지. 연 뒤로는 최신 목록을 계속 들고 있는다
 * @param {boolean} [params.loadFollowing] 팔로잉 탭을 한 번이라도 열었는지. 연 뒤로는 팔로잉 목록을 계속 들고 있는다
 */
export default function useFeedHome({ userId, loadLatest = false, loadFollowing = false }) {
  const queryClient = useQueryClient();

  // 추천 · 최신 피드는 로그인하지 않아도 받는다(userId 없음). 팔로잉 피드는 로그인했을 때만 받는다
  const isConfigured = isApiConfigured;
  const canFetchFollowing = isConfigured && hasId(userId);

  const recommendedQueryOptions = useMemo(
    () => createFeedQueryOptions({ userId, feedType: FEED_TAB.RECOMMENDED, enabled: isConfigured }),
    [isConfigured, userId]
  );

  const latestQueryOptions = useMemo(
    () => createFeedQueryOptions({ userId, feedType: FEED_TAB.LATEST, enabled: isConfigured }),
    [isConfigured, userId]
  );

  const followingQueryOptions = useMemo(
    () => createFeedQueryOptions({ userId, feedType: FEED_TAB.FOLLOWING, enabled: canFetchFollowing }),
    [canFetchFollowing, userId]
  );

  // 최신 · 팔로잉 탭을 열기 전에는 목록을 구독하지 않고, 아래에서 미리 받아 두기만 한다
  const latestListQueryOptions = useMemo(
    () => ({ ...latestQueryOptions, enabled: isConfigured && loadLatest }),
    [isConfigured, latestQueryOptions, loadLatest]
  );

  const followingListQueryOptions = useMemo(
    () => ({ ...followingQueryOptions, enabled: canFetchFollowing && loadFollowing }),
    [canFetchFollowing, followingQueryOptions, loadFollowing]
  );

  const recommended = useFeedList({
    userId,
    queryOptions: recommendedQueryOptions,
    resetPagesOnRefresh: true,
  });
  const latest = useFeedList({ userId, queryOptions: latestListQueryOptions });
  const following = useFeedList({ userId, queryOptions: followingListQueryOptions });

  const recommendedPageCount = recommended.pageCount;

  // 추천 첫 페이지가 그려진 뒤 한가할 때 아직 안 연 탭의 목록을 미리 받아 둔다
  useEffect(() => {
    if (recommendedPageCount === 0) return;

    const shouldPrefetchLatest = isConfigured && !loadLatest;
    const shouldPrefetchFollowing = canFetchFollowing && !loadFollowing;
    if (!shouldPrefetchLatest && !shouldPrefetchFollowing) return;

    const handle = requestIdleCallback(() => {
      if (shouldPrefetchLatest) void queryClient.prefetchInfiniteQuery(latestQueryOptions);
      if (shouldPrefetchFollowing) void queryClient.prefetchInfiniteQuery(followingQueryOptions);
    });

    return () => cancelIdleCallback(handle);
  }, [
    canFetchFollowing,
    followingQueryOptions,
    isConfigured,
    latestQueryOptions,
    loadFollowing,
    loadLatest,
    queryClient,
    recommendedPageCount,
  ]);

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
    recommended,
    latest,
    following,
    isConfigured,
    handlePressFollow,
    pendingTargetUserIds,
  };
}
