import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { isApiConfigured } from '../../../shared/api/client';
import { fetchCursorPage, flattenPages, getNextCursor } from '../../../shared/api/cursorPage';

import { notificationKeys } from '../api/notificationKeys';
import { hasId } from '../../../shared/utils/id';

const NOTIFICATION_LIMIT = 20;

const fetchNotificationPage = ({ userId, type, pageParam }) =>
  fetchCursorPage('/notification', {
    params: { userId, limit: NOTIFICATION_LIMIT, ...(type ? { type } : {}) },
    cursor: pageParam,
  });

// 알림 목록 조회. 최근 30일 알림만 온다. type이 null이면 전체.
const useNotifications = ({ userId, type = null } = {}) => {
  const isConfigured = Boolean(isApiConfigured && hasId(userId));

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
    getNextPageParam: getNextCursor,
  });

  const notifications = useMemo(() => flattenPages(data?.pages), [data?.pages]);

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
