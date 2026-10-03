import { isApiConfigured } from '../../../shared/api/client';
import { fetchCursorPage, getNextCursor } from '../../../shared/api/cursorPage';
import { hasId } from '../../../shared/utils/id';

import { archiveKeys } from './archiveKeys';

// 내가 북마크한 글 목록 쿼리. 보관함 화면(useBookmarkFeeds)과 피드의 미리 받기(prefetchBookmarkFeeds)가 같이 쓴다
// GET /feed/bookmark/me?userId=&filter=&sort=&cursor=&limit=

const BOOKMARK_FEED_LIMIT = 20;

const fetchBookmarkFeedPage = ({ userId, filter, sort, pageParam }) =>
  fetchCursorPage('/feed/bookmark/me', {
    params: { userId, filter, sort, limit: BOOKMARK_FEED_LIMIT },
    cursor: pageParam,
  });

export const isBookmarkFeedsConfigured = ({ userId }) => Boolean(isApiConfigured && hasId(userId));

export const getBookmarkFeedsQueryOptions = ({ userId, filter, sort }) => ({
  queryKey: archiveKeys.bookmarkFeeds(userId, filter, sort),
  initialPageParam: null,
  queryFn: ({ pageParam }) => fetchBookmarkFeedPage({ userId, filter, sort, pageParam }),
  getNextPageParam: getNextCursor,
});

// 북마크 탭을 열 때 처음 보이는 목록(전체 · 최신순)을 미리 받아 둔다
export const prefetchBookmarkFeeds = (queryClient, { userId, filter = 'all', sort = 'latest' }) => {
  if (!isBookmarkFeedsConfigured({ userId })) return;

  void queryClient.prefetchInfiniteQuery(getBookmarkFeedsQueryOptions({ userId, filter, sort }));
};
