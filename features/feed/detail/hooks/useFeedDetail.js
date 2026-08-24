import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  feedHomeKeys,
  findFeedItemInHomeCache,
  removeFeedItem,
} from '../../home/hooks/feedHomeCache';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');
const DETAIL_STALE_TIME = 2 * 60 * 1000;
const DETAIL_GC_TIME = 30 * 60 * 1000;

const getFeedDetailKey = (feedId, userId) => ['feed-detail', String(feedId), userId];

export default function useFeedDetail({ feedId, userId, onDeleteSuccess }) {
  const queryClient = useQueryClient();
  const isConfigured = Boolean(API_BASE_URL);
  const detailQueryKey = getFeedDetailKey(feedId, userId);

  const {
    data: feed,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: detailQueryKey,

    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/feed/${feedId}`, {
        params: { userId },
      });

      return response.data;
    },

    enabled: isConfigured && Number(feedId) > 0 && Number(userId) > 0,

    placeholderData: () => findFeedItemInHomeCache(
      queryClient,
      userId,
      feedId,
    ) ?? undefined,

    staleTime: DETAIL_STALE_TIME,
    gcTime: DETAIL_GC_TIME,
  });

  const deleteFeedMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.delete(`${API_BASE_URL}/feed/${feedId}`, {
        params: { userId },
      });

      return response.data;
    },

    onSuccess: () => {
      queryClient.setQueriesData(
        { queryKey: feedHomeKeys.user(userId) },
        currentData => removeFeedItem(currentData, feedId),
      );

      queryClient.removeQueries({ queryKey: detailQueryKey });
      onDeleteSuccess?.();
    },

    onError: mutationError => {
      console.warn(
        '피드 삭제에 실패했습니다.',
        mutationError.response?.data ?? mutationError.message,
      );
    },
  });

  return {
    feed,
    isConfigured,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    deleteFeed: deleteFeedMutation.mutate,
    isDeletingFeed: deleteFeedMutation.isPending,
    deleteFeedError: deleteFeedMutation.error,
  };
}