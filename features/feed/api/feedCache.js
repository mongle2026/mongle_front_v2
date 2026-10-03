import {
  applyBookmarkFollowState,
  cancelLoadedBookmarkQueries,
  refreshBookmarkFollowingFeeds,
  revertBookmarkFollowState,
} from '../../archive/api/bookmarkCache';
import {
  findInfiniteItem,
  isLoadedQuery,
  mapInfiniteItems,
  removeInfiniteItems,
  withAuthorFollowing,
} from '../../../shared/api/infiniteCache';
import { isSameId, toIdKey } from '../../../shared/utils/id';

const FEED_HOME_QUERY_ROOT = ['feed-home'];

export const feedHomeKeys = {
  all: FEED_HOME_QUERY_ROOT,
  user: userId => [...FEED_HOME_QUERY_ROOT, toIdKey(userId)],
  list: (userId, feedType) => [...FEED_HOME_QUERY_ROOT, toIdKey(userId), feedType],
};

const FEED_DETAIL_QUERY_ROOT = ['feed-detail'];

export const feedDetailKeys = {
  all: FEED_DETAIL_QUERY_ROOT,
  user: userId => [...FEED_DETAIL_QUERY_ROOT, toIdKey(userId)],
  detail: (userId, feedId) => [...FEED_DETAIL_QUERY_ROOT, toIdKey(userId), toIdKey(feedId)],
};

const FEED_COMMENTS_QUERY_ROOT = ['feed-comments'];

export const feedCommentKeys = {
  all: FEED_COMMENTS_QUERY_ROOT,
  list: (feedId, userId) => [...FEED_COMMENTS_QUERY_ROOT, toIdKey(feedId) ?? '', toIdKey(userId)],
};

const isFeed = feedId => item => isSameId(item?.feedId, feedId);

export function updateFeedItem(queryData, feedId, updater) {
  return mapInfiniteItems(queryData, item => (isFeed(feedId)(item) ? updater(item) : item));
}

export function removeFeedItem(queryData, feedId) {
  return removeInfiniteItems(queryData, isFeed(feedId));
}

export function findFeedItemInHomeCache(queryClient, userId, feedId) {
  if (!queryClient || userId == null || feedId == null) return null;

  const cachedQueries = queryClient.getQueriesData({ queryKey: feedHomeKeys.user(userId) });

  for (const [, queryData] of cachedQueries) {
    const item = findInfiniteItem(queryData, isFeed(feedId));
    if (item) return item;
  }

  return null;
}

// 상세 캐시를 먼저 보고, 없으면 홈 캐시에서 찾는다
export function findFeedItemInCache(queryClient, userId, feedId) {
  if (!queryClient || userId == null || feedId == null) return null;

  return queryClient.getQueryData(feedDetailKeys.detail(userId, feedId))
    ?? findFeedItemInHomeCache(queryClient, userId, feedId);
}

// 홈(추천/팔로잉) 목록과 상세 캐시에 있는 같은 피드를 함께 바꾼다
export function updateFeedInAllCaches(queryClient, userId, feedId, updater) {
  queryClient.setQueriesData(
    { queryKey: feedHomeKeys.user(userId) },
    queryData => updateFeedItem(queryData, feedId, updater),
  );

  queryClient.setQueryData(
    feedDetailKeys.detail(userId, feedId),
    feed => (feed ? updater(feed) : feed),
  );
}

// 팔로우 상태를 홈(추천/팔로잉)·상세 캐시에 반영한다. 보관함 북마크는 bookmarkCache 에서 따로 맞춘다.
// 팔로잉 피드는 언팔로우면 그 사람 글을 빼고, 팔로우면 넣을 글 데이터가 없으니 서버 반영 후 다시 받는다
function writeFollowState(queryClient, { userId, targetUserId, nextFollowing }) {
  queryClient.setQueriesData(
    { queryKey: feedHomeKeys.list(userId, 'recommended') },
    queryData => mapInfiniteItems(queryData, item => withAuthorFollowing(item, targetUserId, nextFollowing)),
  );

  if (!nextFollowing) {
    queryClient.setQueriesData(
      { queryKey: feedHomeKeys.list(userId, 'following') },
      queryData => removeInfiniteItems(queryData, item => isSameId(item?.user?.userId, targetUserId)),
    );
  }

  queryClient.setQueriesData(
    { queryKey: feedDetailKeys.user(userId) },
    feed => withAuthorFollowing(feed, targetUserId, nextFollowing),
  );
}

// 서버 응답 전에 팔로우 상태를 화면에 반영한다
export async function applyFollowState(queryClient, { userId, targetUserId, nextFollowing }) {
  await Promise.all([
    queryClient.cancelQueries({ queryKey: feedHomeKeys.user(userId), predicate: isLoadedQuery }),
    queryClient.cancelQueries({ queryKey: feedDetailKeys.user(userId), predicate: isLoadedQuery }),
    cancelLoadedBookmarkQueries(queryClient, userId),
  ]);

  writeFollowState(queryClient, { userId, targetUserId, nextFollowing });
  applyBookmarkFollowState(queryClient, { userId, targetUserId, nextFollowing });
}

// 팔로우가 서버에 반영된 뒤 팔로잉 목록을 다시 받게 한다
export function refreshFollowingFeeds(queryClient, { userId }) {
  queryClient.invalidateQueries({
    queryKey: feedHomeKeys.list(userId, 'following'),
    refetchType: 'none',
  });

  refreshBookmarkFollowingFeeds(queryClient, { userId });
}

// 팔로우 요청이 실패하면 되돌린다. 언팔로우로 뺀 글은 캐시에 남아 있지 않으니 다시 받는다
export function revertFollowState(queryClient, { userId, targetUserId, nextFollowing }) {
  writeFollowState(queryClient, { userId, targetUserId, nextFollowing: !nextFollowing });

  if (!nextFollowing) {
    queryClient.invalidateQueries({ queryKey: feedHomeKeys.list(userId, 'following') });
  }

  revertBookmarkFollowState(queryClient, { userId, targetUserId, nextFollowing });
}
