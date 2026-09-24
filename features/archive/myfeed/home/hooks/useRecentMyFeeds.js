import { useQuery } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../../../shared/api/client';

import { archiveKeys } from '../../../api/archiveKeys';

// 보관함 최근 기록. GET /feed/me?userId=&limit=
// 편지는 들어가지 않고 내가 쓴 피드만 최신순으로 온다.
const useRecentMyFeeds = ({ userId, limit }) => {
  const isConfigured = Boolean(isApiConfigured && Number(userId) > 0);

  const { data, isPending } = useQuery({
    queryKey: archiveKeys.recentMyFeeds(userId, limit),
    enabled: isConfigured,
    queryFn: async () => {
      const response = await apiClient.get('/feed/me', { params: { userId, limit } });
      return Array.isArray(response.data?.items) ? response.data.items : [];
    },
  });

  return {
    recentFeeds: data ?? [],
    isRecentFeedsLoading: isConfigured && isPending,
  };
};

export default useRecentMyFeeds;
