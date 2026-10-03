import apiClient, { getApiErrorDetail, isApiConfigured } from '../../../../shared/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  feedDetailKeys,
  feedHomeKeys,
  findFeedItemInHomeCache,
  removeFeedItem,
} from '../../api/feedCache';
import { normalizeFeedItem } from '../../api/normalizeFeed';
import { archiveKeys } from '../../../archive/api/archiveKeys';
import { hasId } from '../../../../shared/utils/id';

const DETAIL_STALE_TIME = 2 * 60 * 1000;
const DETAIL_GC_TIME = 30 * 60 * 1000;

export default function useFeedDetail({ feedId, userId, onDeleteSuccess, onDeleteError }) {
  const queryClient = useQueryClient();
  const isConfigured = isApiConfigured;
  const detailQueryKey = feedDetailKeys.detail(userId, feedId);

  const {
    data: feed,
    isLoading,
    error,
  } = useQuery({
    queryKey: detailQueryKey,

    queryFn: async () => {
      const response = await apiClient.get(`/feed/${feedId}`, {
        params: { userId },
      });

      // 홈 캐시(placeholder)와 같은 형태로 맞춘다
      return normalizeFeedItem(response.data);
    },

    enabled: isConfigured && hasId(feedId) && hasId(userId),

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
      const response = await apiClient.delete(`/feed/${feedId}`, {
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
      queryClient.invalidateQueries({ queryKey: archiveKeys.all });
      onDeleteSuccess?.();
    },

    onError: mutationError => {
      console.warn(
        '피드 삭제에 실패했습니다.',
        getApiErrorDetail(mutationError),
      );

      onDeleteError?.(mutationError);
    },
  });

  return {
    feed,
    isConfigured,
    isLoading,
    error,
    deleteFeed: deleteFeedMutation.mutate,
    isDeletingFeed: deleteFeedMutation.isPending,
  };
}