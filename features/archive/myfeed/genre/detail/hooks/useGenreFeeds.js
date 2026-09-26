import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../../../../shared/api/client';

import { archiveKeys } from '../../../../api/archiveKeys';

const GENRE_FEED_LIMIT = 20;

async function fetchGenreFeedPage({ userId, genre, sort, pageParam }) {
  const params = { userId, genre, sort, limit: GENRE_FEED_LIMIT };

  if (pageParam !== null && pageParam !== undefined) {
    params.cursor = pageParam;
  }

  const response = await apiClient.get('/feed/me', { params });
  const data = response.data;

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    nextCursor: data?.nextCursor ?? null,
    hasNext: Boolean(data?.hasNext),
  };
}

// 선택한 장르의 기록. GET /feed/me?userId=&genre=&sort=&cursor=&limit=
// 그 장르 곡을 첨부한 내 피드만 온다.
// sort: latest(최신순) / oldest(오래된순) / title(노래 제목순: 한글 → 영문 → 숫자·기호)
const useGenreFeeds = ({ userId, genre, sort = 'latest' }) => {
  const isConfigured = Boolean(isApiConfigured && Number(userId) > 0 && genre);

  const {
    data,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: archiveKeys.genreFeeds(userId, genre, sort),
    initialPageParam: null,
    enabled: isConfigured,
    queryFn: ({ pageParam }) => fetchGenreFeedPage({ userId, genre, sort, pageParam }),
    getNextPageParam: lastPage => (lastPage?.hasNext ? lastPage.nextCursor ?? undefined : undefined),
  });

  const feeds = useMemo(() => data?.pages?.flatMap(page => page.items) ?? [], [data?.pages]);

  return {
    feeds,
    isGenreFeedsLoading: isConfigured && isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  };
};

export default useGenreFeeds;
