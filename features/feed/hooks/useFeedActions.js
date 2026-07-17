import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const getFeedsKey = userId => ['feeds', userId];
const getFeedDetailKey = (feedId, userId) => ['feed', String(feedId), userId];

function updateFeedInCaches(queryClient, userId, feedId, updater) {
  queryClient.setQueryData(getFeedsKey(userId), oldFeeds => {
    if (!oldFeeds) return oldFeeds;

    return oldFeeds.map(post =>
      String(post.feedId) === String(feedId)
        ? updater(post)
        : post
    );
  });

  queryClient.setQueryData(getFeedDetailKey(feedId, userId), oldFeed => {
    if (!oldFeed) return oldFeed;

    return updater(oldFeed);
  });
}

export default function useFeedActions({ userId, onBookmarkAdded } = {}) {
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async ({ feedId, nextLiked }) => {
      if (nextLiked) {
        return axios.post(`${API_BASE_URL}/feed/${feedId}/like`, null, {
          params: { userId },
        });
      }

      return axios.delete(`${API_BASE_URL}/feed/${feedId}/like`, {
        params: { userId },
      });
    },

    onMutate: async ({ feedId, nextLiked }) => {
      await queryClient.cancelQueries({
        queryKey: getFeedsKey(userId),
      });

      await queryClient.cancelQueries({
        queryKey: getFeedDetailKey(feedId, userId),
      });

      const previousFeeds = queryClient.getQueryData(getFeedsKey(userId));
      const previousFeedDetail = queryClient.getQueryData(
        getFeedDetailKey(feedId, userId)
      );

      updateFeedInCaches(queryClient, userId, feedId, post => ({
        ...post,
        isLiked: nextLiked,
      }));

      return {
        previousFeeds,
        previousFeedDetail,
      };
    },

    onError: (error, variables, context) => {
      if (context?.previousFeeds) {
        queryClient.setQueryData(getFeedsKey(userId), context.previousFeeds);
      }

      if (context?.previousFeedDetail) {
        queryClient.setQueryData(
          getFeedDetailKey(variables.feedId, userId),
          context.previousFeedDetail
        );
      }

      console.log('좋아요 처리 실패:', error);
    },

    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: getFeedsKey(userId),
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: getFeedDetailKey(
          variables.feedId,
          userId
        ),
        refetchType: 'none',
      });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async ({ feedId, nextBookmarked }) => {
      if (nextBookmarked) {
        return axios.post(`${API_BASE_URL}/feed/${feedId}/bookmark`, null, {
          params: { userId },
        });
      }

      return axios.delete(`${API_BASE_URL}/feed/${feedId}/bookmark`, {
        params: { userId },
      });
    },

    onMutate: async ({ feedId, nextBookmarked }) => {
      await queryClient.cancelQueries({
        queryKey: getFeedsKey(userId),
      });

      await queryClient.cancelQueries({
        queryKey: getFeedDetailKey(feedId, userId),
      });

      const previousFeeds = queryClient.getQueryData(getFeedsKey(userId));
      const previousFeedDetail = queryClient.getQueryData(
        getFeedDetailKey(feedId, userId)
      );

      updateFeedInCaches(queryClient, userId, feedId, post => {
        const prevBookmarkCount = Number(post.bookmarkCount ?? 0);

        return {
          ...post,
          isBookmarked: nextBookmarked,
          bookmarkCount: nextBookmarked
            ? prevBookmarkCount + 1
            : Math.max(prevBookmarkCount - 1, 0),
        };
      });

      if (nextBookmarked) {
        onBookmarkAdded?.();
      }

      return {
        previousFeeds,
        previousFeedDetail,
      };
    },

    onError: (error, variables, context) => {
      if (context?.previousFeeds) {
        queryClient.setQueryData(getFeedsKey(userId), context.previousFeeds);
      }

      if (context?.previousFeedDetail) {
        queryClient.setQueryData(
          getFeedDetailKey(variables.feedId, userId),
          context.previousFeedDetail
        );
      }

      console.log('북마크 처리 실패:', error);
    },

    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: getFeedsKey(userId),
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        queryKey: getFeedDetailKey(
          variables.feedId,
          userId
        ),
        refetchType: 'none',
      });
    },
  });

  const mutateLike = likeMutation.mutate;
  const mutateBookmark = bookmarkMutation.mutate;

  const toggleLike = useCallback(
    feed => {
      if (!feed?.feedId) {
        return;
      }

      mutateLike({
        feedId: feed.feedId,
        nextLiked: !feed.isLiked,
      });
    },
    [mutateLike]
  );

  const toggleBookmark = useCallback(
    feed => {
      if (!feed?.feedId) {
        return;
      }

      mutateBookmark({
        feedId: feed.feedId,
        nextBookmarked: !feed.isBookmarked,
      });
    },
    [mutateBookmark]
  );

  return {
    toggleLike,
    toggleBookmark,
    likeMutation,
    bookmarkMutation,
  };
}