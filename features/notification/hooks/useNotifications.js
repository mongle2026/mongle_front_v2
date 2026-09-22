import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../shared/api/client';

import { notificationKeys } from '../api/notificationKeys';

const NOTIFICATION_LIMIT = 20;

function normalizeNotificationPage(data) {
  const items = Array.isArray(data?.items) ? data.items : [];

  return {
    items,
    nextCursor: data?.nextCursor ?? null,
    hasNext: Boolean(data?.hasNext),
  };
}

async function fetchNotificationPage({ userId, type, pageParam }) {
  const params = { userId, limit: NOTIFICATION_LIMIT };

  if (type) {
    params.type = type;
  }

  if (pageParam !== null && pageParam !== undefined) {
    params.cursor = pageParam;
  }

  const response = await apiClient.get('/notification', { params });
  return normalizeNotificationPage(response.data);
}

// 알림 목록 조회. 최근 30일 알림만 온다. type이 null이면 전체.
const useNotifications = ({ userId, type = null } = {}) => {
  const isConfigured = Boolean(isApiConfigured && Number(userId) > 0);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: notificationKeys.list(userId, type),
    initialPageParam: null,
    enabled: isConfigured,
    queryFn: ({ pageParam }) => fetchNotificationPage({ userId, type, pageParam }),
    getNextPageParam: lastPage => (lastPage?.hasNext ? lastPage.nextCursor ?? undefined : undefined),
  });

  const notifications = useMemo(() => data?.pages?.flatMap(page => page.items) ?? [], [data?.pages]);

  return {
    notifications,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetchNotifications: refetch,
  };
};

export default useNotifications;
