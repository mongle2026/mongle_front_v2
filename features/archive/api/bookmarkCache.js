import { archiveKeys } from './archiveKeys';
import {
  findInfiniteItem,
  isLoadedQuery,
  mapInfiniteItems,
  removeInfiniteItems,
  withAuthorFollowing,
} from '../../../shared/api/infiniteCache';
import { isSameId } from '../../../shared/utils/id';

// 보관함 북마크 목록 캐시를 서버 응답 전에 맞춰 두는 함수들.
// 목록 키: archiveKeys.bookmarkFeeds(userId, filter, sort) = ['archive', 'bookmark', userId, filter, sort]

const FILTER_KEY_INDEX = 3;
const SORT_KEY_INDEX = 4;

const FOLLOWER_VISIBILITY = 'FOLLOWER';

const isFeed = feedId => item => isSameId(item?.feedId, feedId);

function insertItem(queryData, item, sort) {
  if (!queryData?.pages?.length || findInfiniteItem(queryData, isFeed(item.feedId))) return queryData;

  // 최신순: 방금 북마크한 글이 맨 앞
  if (sort === 'latest') {
    const [firstPage, ...restPages] = queryData.pages;
    return { ...queryData, pages: [{ ...firstPage, items: [item, ...(firstPage.items ?? [])] }, ...restPages] };
  }

  // 오래된순: 맨 끝이라 마지막 페이지까지 받아 둔 경우에만 붙인다. 아니면 그 페이지를 받을 때 서버에서 온다
  const lastIndex = queryData.pages.length - 1;
  const lastPage = queryData.pages[lastIndex];
  if (lastPage?.hasNext) return queryData;

  const nextPages = [...queryData.pages];
  nextPages[lastIndex] = { ...lastPage, items: [...(lastPage.items ?? []), item] };
  return { ...queryData, pages: nextPages };
}

// 받아오던 목록이 낙관적 반영을 덮어쓰지 않게 먼저 취소한다. 첫 조회 중(데이터 없음)인 목록은 건드리지 않는다
export const cancelLoadedBookmarkQueries = (queryClient, userId) =>
  queryClient.cancelQueries({
    queryKey: archiveKeys.bookmark(userId),
    predicate: isLoadedQuery,
  });

// 북마크를 켜면 목록에 넣는다. feed 는 피드 홈/상세 캐시에 있는 글(GET /feed 응답 형태)
export async function addBookmarkFeed(queryClient, { userId, feed }) {
  if (!feed?.feedId) return;

  await cancelLoadedBookmarkQueries(queryClient, userId);

  // bookmarkId 는 서버에서 다시 받아올 때 채워진다. 다음 페이지 커서는 서버가 준 nextCursor 를 쓰므로 영향이 없다
  const item = { ...feed, isBookmarked: true, bookmarkId: null };
  const isFollowingAuthor = Boolean(feed?.user?.isFollowing);

  queryClient.getQueriesData({ queryKey: archiveKeys.bookmark(userId) }).forEach(([queryKey]) => {
    const filter = queryKey[FILTER_KEY_INDEX];
    const sort = queryKey[SORT_KEY_INDEX];

    if (filter === 'following' && !isFollowingAuthor) return;

    queryClient.setQueryData(queryKey, queryData => insertItem(queryData, item, sort));
  });
}

// 북마크를 끄면 모든 목록에서 뺀다
export async function removeBookmarkFeed(queryClient, { userId, feedId }) {
  await cancelLoadedBookmarkQueries(queryClient, userId);

  queryClient.setQueriesData(
    { queryKey: archiveKeys.bookmark(userId) },
    queryData => removeInfiniteItems(queryData, isFeed(feedId)),
  );
}

// 팔로우 상태를 서버 응답 전에 북마크 목록에 반영한다.
// 전체: 프로필 팔로우 상태를 바꾸고, 언팔로우면 더 볼 수 없는 팔로워 공개 글을 뺀다
// 팔로잉: 언팔로우면 그 사람 글을 뺀다. 팔로우면 넣을 글 데이터가 없으니 서버 반영 후 다시 받는다(refreshBookmarkFollowingFeeds)
export function applyBookmarkFollowState(queryClient, { userId, targetUserId, nextFollowing }) {
  const isTargetItem = item => isSameId(item?.user?.userId, targetUserId);

  queryClient.setQueriesData(
    { queryKey: [...archiveKeys.bookmark(userId), 'all'] },
    queryData => {
      const nextData = nextFollowing
        ? queryData
        : removeInfiniteItems(queryData, item => isTargetItem(item) && item?.visibility === FOLLOWER_VISIBILITY);

      return mapInfiniteItems(nextData, item => withAuthorFollowing(item, targetUserId, nextFollowing));
    },
  );

  if (nextFollowing) return;

  queryClient.setQueriesData(
    { queryKey: [...archiveKeys.bookmark(userId), 'following'] },
    queryData => removeInfiniteItems(queryData, isTargetItem),
  );
}

// 팔로우가 서버에 반영된 뒤 팔로잉 북마크 목록을 다시 받는다
export function refreshBookmarkFollowingFeeds(queryClient, { userId }) {
  queryClient.invalidateQueries({ queryKey: [...archiveKeys.bookmark(userId), 'following'] });
}

// 팔로우 요청이 실패하면 되돌린다. 언팔로우로 뺀 글은 캐시에 남아 있지 않으니 다시 받는다
export function revertBookmarkFollowState(queryClient, { userId, targetUserId, nextFollowing }) {
  applyBookmarkFollowState(queryClient, { userId, targetUserId, nextFollowing: !nextFollowing });

  if (!nextFollowing) {
    queryClient.invalidateQueries({ queryKey: archiveKeys.bookmark(userId) });
  }
}
