import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../../../shared/api/client';

import { normalizeLetterboxItem } from '../../../utils/normalizeLetter';
import { letterboxKeys } from '../../../api/letterboxKeys';

const LETTERBOX_LIMIT = 20;

// LetterSection 필터 key → 백엔드 LetterboxTab
const LETTERBOX_TAB = {
  unread: 'UNREAD',
  all: 'ALL',
  received: 'RECEIVED',
  sent: 'SENT',
  self: 'SELF',
};

function normalizeLetterboxPage(data) {
  const rawItems = Array.isArray(data?.items) ? data.items : [];

  return {
    items: rawItems.map(normalizeLetterboxItem).filter(Boolean),
    nextCursor: data?.nextCursor ?? null,
    hasNext: Boolean(data?.hasNext),
  };
}

async function fetchLetterboxPage({ userId, tab, pageParam }) {
  const params = { userId, tab, limit: LETTERBOX_LIMIT };

  if (pageParam !== null && pageParam !== undefined) {
    params.cursor = pageParam;
  }

  const response = await apiClient.get('/letter', { params });
  return normalizeLetterboxPage(response.data);
}

// 편지함 편지 목록 조회.
const useLetterBox = ({ userId, filter } = {}) => {
  const tab = LETTERBOX_TAB[filter];
  const isConfigured = Boolean(isApiConfigured && Number(userId) > 0 && tab);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: letterboxKeys.letterList(userId, tab),
    initialPageParam: null,
    enabled: isConfigured,
    queryFn: ({ pageParam }) => fetchLetterboxPage({ userId, tab, pageParam }),
    getNextPageParam: lastPage => (lastPage?.hasNext ? lastPage.nextCursor ?? undefined : undefined),
  });

  const letters = useMemo(() => data?.pages?.flatMap(page => page.items) ?? [], [data?.pages]);

  return {
    letters,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetchLetters: refetch,
  };
};

export default useLetterBox;
