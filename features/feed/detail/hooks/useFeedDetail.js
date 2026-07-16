import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function useFeedDetail({
  feedId,
  userId,
  initialFeedData,
  onDeleteSuccess,
  enabled = true,
}) {
  const queryClient = useQueryClient();

  const {
    data: apiFeed,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['feed', String(feedId), userId],

    queryFn: async () => {
      const response = await axios.get(
        `${API_BASE_URL}/feed/${feedId}`,
        {
          params: { userId },
        }
      );

      return response.data;
    },

    enabled:
      enabled &&
      !!API_BASE_URL &&
      !!feedId &&
      !!userId,

    staleTime: 30_000,
  });

  const deleteFeedMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.delete(`${API_BASE_URL}/feed/${feedId}`, {
        params: { userId },
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['feeds'] });

      onDeleteSuccess?.();
    },
    onError: (error) => {
      console.log('피드 삭제 실패:', error.response?.data ?? error.message);
    },
  });

  const feed = apiFeed ?? initialFeedData;

  return {
    feed,
    isLoading,
    isError,
    error,
    refetch,

    deleteFeed: deleteFeedMutation.mutate,
    isDeletingFeed: deleteFeedMutation.isPending,
    deleteFeedError: deleteFeedMutation.error,
  };
}