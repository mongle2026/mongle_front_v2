import { useCallback, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import useFollow from '../../../../shared/hooks/useFollow';
import { feedHomeKeys } from './feedHomeCache';
import useFeedToggleMutation from './useFeedToggleMutation';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');

const FEED_LIMIT = 20;

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
  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : [];

  const nextCursor = Array.isArray(data)
    ? null
    : data?.nextCursor ?? null;

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

  return {
    ...data,
    pages: data.pages.map(page => ({
      ...page,
      items: page.items.map(item => {
        if (String(item?.user?.userId) !== targetId) return item;

        return {
          ...item,
          user: {
            ...item.user,
            isFollowing: nextFollowing,
          },
        };
      }),
    })),
  };
}

function removeUserFromFeed(data, targetUserId) {
  if (!data?.pages) return data;

  const targetId = String(targetUserId);

  return {
    ...data,
    pages: data.pages.map(page => ({
      ...page,
      items: page.items.filter(
        item => String(item?.user?.userId) !== targetId,
      ),
    })),
  };
}

export default function useFeedHome({
  userId,
  isFollowing = false,
}) {
  const queryClient = useQueryClient();

  const hasUserId =
    userId !== null &&
    userId !== undefined;

  const isConfigured = Boolean(
    API_BASE_URL &&
    hasUserId,
  );

  const feedPath = isFollowing
    ? '/feed/following'
    : '/feed';

  const feedType = isFollowing
    ? 'following'
    : 'recommended';

  const recommendedQueryKey = useMemo(
    () => feedHomeKeys.list(userId, 'recommended'),
    [userId],
  );

  const followingQueryKey = useMemo(
    () => feedHomeKeys.list(userId, 'following'),
    [userId],
  );

  const feedQueryKey = isFollowing
    ? followingQueryKey
    : recommendedQueryKey;

  const {
    data,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchFeed,
  } = useInfiniteQuery({
    queryKey: feedQueryKey,
    initialPageParam: null,
    enabled: isConfigured,

    queryFn: async ({ pageParam }) => {
      if (!API_BASE_URL) {
        throw new Error(
          'EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다.',
        );
      }

      const params = {
        userId,
        limit: FEED_LIMIT,
      };

      if (
        pageParam !== null &&
        pageParam !== undefined
      ) {
        params.cursor = pageParam;
      }

      const response = await axios.get(
        `${API_BASE_URL}${feedPath}`,
        { params },
      );

      return normalizeFeedPage(response.data);
    },

    getNextPageParam: lastPage => {
      if (!lastPage?.hasNext) return undefined;
      return lastPage.nextCursor ?? undefined;
    },

    staleTime: 30_000,
  });

  const posts = useMemo(
    () =>
      data?.pages?.flatMap(
        page => page.items,
      ) ?? [],
    [data?.pages],
  );

  const {
    mutate: mutateLike,
    pendingFeedIds: likePendingFeedIds,
  } = useFeedToggleMutation({
    userId,
    endpoint: 'like',
    valueKey: 'isLiked',
    countKey: 'likeCount',
    errorMessage: '좋아요 처리에 실패했습니다.',
  });

  const {
    mutate: mutateBookmark,
    pendingFeedIds: bookmarkPendingFeedIds,
  } = useFeedToggleMutation({
    userId,
    endpoint: 'bookmark',
    valueKey: 'isBookmarked',
    countKey: 'bookmarkCount',
    errorMessage: '북마크 처리에 실패했습니다.',
  });

  const {
    toggleFollow,
    pendingTargetUserId,
  } = useFollow({
    currentUserId: userId,

    onSuccess: (_, {
      targetUserId,
      nextFollowing,
    }) => {
      queryClient.setQueryData(
        recommendedQueryKey,
        currentData =>
          updateFollowState(
            currentData,
            targetUserId,
            nextFollowing,
          ),
      );

      queryClient.setQueryData(
        followingQueryKey,
        currentData => {
          if (!nextFollowing) {
            return removeUserFromFeed(
              currentData,
              targetUserId,
            );
          }

          return currentData;
        },
      );
    },
  });

  const handlePressLike = useCallback(
    feed => {
      if (!feed?.feedId) return;

      mutateLike({
        feedId: feed.feedId,
        nextValue: !feed.isLiked,
      });
    },
    [mutateLike],
  );

  const handlePressBookmark = useCallback(
    feed => {
      if (!feed?.feedId) return;

      mutateBookmark({
        feedId: feed.feedId,
        nextValue: !feed.isBookmarked,
      });
    },
    [mutateBookmark],
  );

  const handlePressFollow = useCallback(
    feed => {
      const targetUserId = feed?.user?.userId;

      if (!targetUserId) return;
      if (String(targetUserId) === String(userId)) return;

      toggleFollow(
        targetUserId,
        Boolean(feed?.user?.isFollowing),
      );
    },
    [toggleFollow, userId],
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

    handlePressLike,
    handlePressBookmark,
    handlePressFollow,

    likePendingFeedIds,
    bookmarkPendingFeedIds,
    pendingTargetUserId,
  };
}