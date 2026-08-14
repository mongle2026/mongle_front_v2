import axios from 'axios';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');

export default function useFeedDetail({
  feedId,
  userId,
  onDeleteSuccess,
}) {
  const queryClient = useQueryClient();
  const isConfigured = Boolean(API_BASE_URL);

  const {
    data: feed,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['feed-detail', String(feedId), userId],
    queryFn: async () => {
      const response = await axios.get(
        `${API_BASE_URL}/feed/${feedId}`,
        {
          params: { userId },
        },
      );

      return response.data;
    },
    enabled:
      isConfigured &&
      Number(feedId) > 0 &&
      Number(userId) > 0,
    staleTime: 30_000,
  });

  const deleteFeedMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.delete(
        `${API_BASE_URL}/feed/${feedId}`,
        {
          params: { userId },
        },
      );

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['feed-home'],
      });

      queryClient.removeQueries({
        queryKey: ['feed-detail', String(feedId), userId],
      });

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