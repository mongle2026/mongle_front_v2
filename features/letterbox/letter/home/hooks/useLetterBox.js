import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';

import { normalizeLetterboxItem } from '../../../utils/normalizeLetter';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');

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
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다.');
  }

  const params = { userId, tab, limit: LETTERBOX_LIMIT };

  if (pageParam !== null && pageParam !== undefined) {
    params.cursor = pageParam;
  }

  const response = await axios.get(`${API_BASE_URL}/letter`, { params });
  return normalizeLetterboxPage(response.data);
}

// 편지함 편지 목록 조회.
// queryKey는 ['letterbox', ...]로 둔다 (useCreateLetter가 편지 전송 후 ['letterbox']를 invalidate 한다).
const useLetterBox = ({ userId, filter } = {}) => {
  const tab = LETTERBOX_TAB[filter];
  const isConfigured = Boolean(API_BASE_URL && Number(userId) > 0 && tab);

  const {
    data,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['letterbox', Number(userId), tab],
    initialPageParam: null,
    enabled: isConfigured,
    queryFn: ({ pageParam }) => fetchLetterboxPage({ userId, tab, pageParam }),
    getNextPageParam: lastPage => (lastPage?.hasNext ? lastPage.nextCursor ?? undefined : undefined),
  });

  const letters = useMemo(() => data?.pages?.flatMap(page => page.items) ?? [], [data?.pages]);

  return {
    letters,
    error,
    isConfigured,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetchLetters: refetch,
  };
};

export default useLetterBox;
