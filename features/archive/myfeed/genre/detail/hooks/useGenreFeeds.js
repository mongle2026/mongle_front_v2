import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../../../../shared/api/client';

import { archiveKeys } from '../../../../api/archiveKeys';
import { hasId } from '../../../../../../shared/utils/id';

const GENRE_FEED_LIMIT = 20;
const DEFAULT_SORT = 'latest';

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

const isGenreFeedsConfigured = ({ userId, genre }) =>
  Boolean(isApiConfigured && hasId(userId) && genre);

const getGenreFeedsQueryOptions = ({ userId, genre, sort }) => ({
  queryKey: archiveKeys.genreFeeds(userId, genre, sort),
  initialPageParam: null,
  queryFn: ({ pageParam }) => fetchGenreFeedPage({ userId, genre, sort, pageParam }),
  getNextPageParam: lastPage => (lastPage?.hasNext ? lastPage.nextCursor ?? undefined : undefined),
});

// 장르를 누르는 순간 첫 페이지를 불러오기 시작해서, 화면이 넘어오는 동안 받아 둔다
export const prefetchGenreFeeds = (queryClient, { userId, genre, sort = DEFAULT_SORT }) => {
  if (!isGenreFeedsConfigured({ userId, genre })) return;
  void queryClient.prefetchInfiniteQuery(getGenreFeedsQueryOptions({ userId, genre, sort }));
};

// 선택한 장르의 기록. GET /feed/me?userId=&genre=&sort=&cursor=&limit=
// 그 장르 곡을 첨부한 내 피드만 온다.
// sort: latest(최신순) / oldest(오래된순) / title(노래 제목순: 한글 → 영문 → 숫자·기호)
const useGenreFeeds = ({ userId, genre, sort = DEFAULT_SORT }) => {
  const isConfigured = isGenreFeedsConfigured({ userId, genre });

  const {
    data,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    ...getGenreFeedsQueryOptions({ userId, genre, sort }),
    enabled: isConfigured,
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
