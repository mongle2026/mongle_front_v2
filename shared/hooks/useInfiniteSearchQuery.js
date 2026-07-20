import {
  useCallback,
  useMemo,
} from 'react';

import {
  keepPreviousData,
  useInfiniteQuery,
} from '@tanstack/react-query';

import useDebouncedValue from './useDebouncedValue';

function defaultGetNextPageParam(lastPage) {
  if (!lastPage?.hasNextPage) {
    return undefined;
  }

  return lastPage.nextPage ?? undefined;
}

export default function useInfiniteSearchQuery({
  queryKey,
  keyword = '',
  fetchPage,

  enabled = true,
  minimumKeywordLength = 0,

  debounceMs = 400,
  emptyKeywordDebounceMs = 0,

  initialPageParam = 1,
  getNextPageParam = defaultGetNextPageParam,

  getItemKey,

  keepPreviousResults = true,

  staleTime = 30 * 1000,
  gcTime = 5 * 60 * 1000,
}) {
  const normalizedKeyword = keyword.trim();

  const currentDebounceMs = normalizedKeyword
    ? debounceMs
    : emptyKeywordDebounceMs;

  const debouncedKeyword = useDebouncedValue(
    normalizedKeyword,
    currentDebounceMs,
  );

  const isDebouncing =
    normalizedKeyword !== debouncedKeyword;

  const queryEnabled =
    enabled &&
    debouncedKeyword.length >=
      minimumKeywordLength;

  const query = useInfiniteQuery({
    queryKey: [
      ...queryKey,
      debouncedKeyword,
    ],

    queryFn: ({
      pageParam,
      signal,
    }) => {
      return fetchPage({
        keyword: debouncedKeyword,
        pageParam,
        signal,
      });
    },

    initialPageParam,

    getNextPageParam,

    enabled: queryEnabled,

    placeholderData: keepPreviousResults
      ? keepPreviousData
      : undefined,

    staleTime,
    gcTime,
  });

  const items = useMemo(() => {
    const pages = query.data?.pages ?? [];

    const allItems = pages.flatMap(page => {
      return Array.isArray(page?.items)
        ? page.items
        : [];
    });

    if (!getItemKey) {
      return allItems;
    }

    const itemMap = new Map();

    allItems.forEach(item => {
      const key = getItemKey(item);

      if (key === null || key === undefined) {
        return;
      }

      itemMap.set(String(key), item);
    });

    return Array.from(itemMap.values());
  }, [
    query.data?.pages,
    getItemKey,
  ]);

  const handleLoadMore = useCallback(() => {
    // 사용자가 입력 중일 때 이전 검색어의
    // 다음 페이지를 불러오지 않습니다.
    if (isDebouncing) {
      return;
    }

    // 이전 결과를 임시로 표시 중일 때는
    // 해당 결과의 다음 페이지를 요청하지 않습니다.
    if (query.isPlaceholderData) {
      return;
    }

    if (!query.hasNextPage) {
      return;
    }

    if (
      query.isFetching ||
      query.isFetchingNextPage
    ) {
      return;
    }

    query.fetchNextPage({
      cancelRefetch: false,
    });
  }, [
    isDebouncing,
    query.fetchNextPage,
    query.hasNextPage,
    query.isFetching,
    query.isFetchingNextPage,
    query.isPlaceholderData,
  ]);

  const loading =
    query.isPending &&
    items.length === 0;

  return {
    items,

    normalizedKeyword,
    debouncedKeyword,
    isDebouncing,

    loading,
    loadingMore:
      query.isFetchingNextPage,

    isFetching:
      query.isFetching,

    isRefetching:
      query.isRefetching,

    hasNextPage:
      Boolean(query.hasNextPage),

    error: query.error,

    handleLoadMore,
    refetch: query.refetch,
  };
}