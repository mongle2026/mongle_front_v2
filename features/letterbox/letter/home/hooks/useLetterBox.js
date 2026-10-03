import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { isApiConfigured } from '../../../../../shared/api/client';
import { fetchCursorPage, flattenPages, getNextCursor } from '../../../../../shared/api/cursorPage';

import { normalizeLetterboxItem } from '../../../utils/normalizeLetter';
import { letterboxKeys } from '../../../api/letterboxKeys';
import { hasId } from '../../../../../shared/utils/id';

const LETTERBOX_LIMIT = 20;

// LetterSection 필터 key → 백엔드 LetterboxTab
const LETTERBOX_TAB = {
  unread: 'UNREAD',
  all: 'ALL',
  received: 'RECEIVED',
  sent: 'SENT',
  self: 'SELF',
};

const fetchLetterboxPage = ({ userId, tab, pageParam }) =>
  fetchCursorPage('/letter', {
    params: { userId, tab, limit: LETTERBOX_LIMIT },
    cursor: pageParam,
    mapItem: normalizeLetterboxItem,
  });

// 편지함 편지 목록 조회.
const useLetterBox = ({ userId, filter } = {}) => {
  const tab = LETTERBOX_TAB[filter];
  const isConfigured = Boolean(isApiConfigured && hasId(userId) && tab);

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
    getNextPageParam: getNextCursor,
  });

  const letters = useMemo(() => flattenPages(data?.pages), [data?.pages]);

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
