import {
  applyBookmarkFollowState,
  cancelLoadedBookmarkQueries,
  refreshBookmarkFollowingFeeds,
  revertBookmarkFollowState,
} from '../../archive/api/bookmarkCache';
import { toIdKey } from '../../../shared/utils/id';

const normalizeId = value => String(value);

const FEED_HOME_QUERY_ROOT = ['feed-home'];

export const feedHomeKeys = {
  all: FEED_HOME_QUERY_ROOT,
  user: userId => [...FEED_HOME_QUERY_ROOT, normalizeId(userId)],
  list: (userId, feedType) => [...FEED_HOME_QUERY_ROOT, normalizeId(userId), feedType],
};

const FEED_DETAIL_QUERY_ROOT = ['feed-detail'];

export const feedDetailKeys = {
  all: FEED_DETAIL_QUERY_ROOT,
  user: userId => [...FEED_DETAIL_QUERY_ROOT, normalizeId(userId)],
  detail: (userId, feedId) => [...FEED_DETAIL_QUERY_ROOT, normalizeId(userId), normalizeId(feedId)],
};

const FEED_COMMENTS_QUERY_ROOT = ['feed-comments'];

export const feedCommentKeys = {
  all: FEED_COMMENTS_QUERY_ROOT,
  list: (feedId, userId) => [...FEED_COMMENTS_QUERY_ROOT, feedId != null ? normalizeId(feedId) : '', toIdKey(userId)],
};

export function updateFeedItem(queryData, feedId, updater) {
  if (!queryData?.pages) return queryData;

  const normalizedFeedId = normalizeId(feedId);
  let hasChanged = false;

  const nextPages = queryData.pages.map(page => {
    if (!Array.isArray(page?.items)) return page;

    const nextItems = page.items.map(item => {
      if (normalizeId(item?.feedId) !== normalizedFeedId) return item;

      hasChanged = true;
      return updater(item);
    });

    return hasChanged ? { ...page, items: nextItems } : page;
  });

  return hasChanged ? { ...queryData, pages: nextPages } : queryData;
}

export function removeFeedItem(queryData, feedId) {
  if (!queryData?.pages) return queryData;

  const normalizedFeedId = normalizeId(feedId);
  let hasChanged = false;

  const nextPages = queryData.pages.map(page => {
    if (!Array.isArray(page?.items)) return page;

    const nextItems = page.items.filter(item => {
      const shouldRemove = normalizeId(item?.feedId) === normalizedFeedId;
      if (shouldRemove) hasChanged = true;
      return !shouldRemove;
    });

    return nextItems.length === page.items.length ? page : { ...page, items: nextItems };
  });

  return hasChanged ? { ...queryData, pages: nextPages } : queryData;
}

export function findFeedItem(queryData, feedId) {
  if (!queryData?.pages) return null;

  const normalizedFeedId = normalizeId(feedId);

  for (const page of queryData.pages) {
    const item = page?.items?.find(feed => normalizeId(feed?.feedId) === normalizedFeedId);
    if (item) return item;
  }

  return null;
}

export function findFeedItemInHomeCache(queryClient, userId, feedId) {
  if (!queryClient || userId == null || feedId == null) return null;

  const cachedQueries = queryClient.getQueriesData({ queryKey: feedHomeKeys.user(userId) });

  for (const [, queryData] of cachedQueries) {
    const item = findFeedItem(queryData, feedId);
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

function updateFollowState(queryData, targetUserId, nextFollowing) {
  if (!queryData?.pages) return queryData;

  const targetId = normalizeId(targetUserId);
  let hasChanged = false;

  const nextPages = queryData.pages.map(page => {
    if (!Array.isArray(page?.items)) return page;

    let pageChanged = false;
    const nextItems = page.items.map(item => {
      if (normalizeId(item?.user?.userId) !== targetId) return item;
      if (Boolean(item?.user?.isFollowing) === nextFollowing) return item;

      hasChanged = true;
      pageChanged = true;

      return { ...item, user: { ...item.user, isFollowing: nextFollowing } };
    });

    return pageChanged ? { ...page, items: nextItems } : page;
  });

  return hasChanged ? { ...queryData, pages: nextPages } : queryData;
}

function removeUserFromFeed(queryData, targetUserId) {
  if (!queryData?.pages) return queryData;

  const targetId = normalizeId(targetUserId);
  let hasChanged = false;

  const nextPages = queryData.pages.map(page => {
    if (!Array.isArray(page?.items)) return page;

    const nextItems = page.items.filter(item => {
      const shouldRemove = normalizeId(item?.user?.userId) === targetId;
      if (shouldRemove) hasChanged = true;
      return !shouldRemove;
    });

    return nextItems.length === page.items.length ? page : { ...page, items: nextItems };
  });

  return hasChanged ? { ...queryData, pages: nextPages } : queryData;
}

// 팔로우 상태를 홈(추천/팔로잉)·상세 캐시에 반영한다. 보관함 북마크는 bookmarkCache 에서 따로 맞춘다.
// 팔로잉 피드는 언팔로우면 그 사람 글을 빼고, 팔로우면 넣을 글 데이터가 없으니 서버 반영 후 다시 받는다
function writeFollowState(queryClient, { userId, targetUserId, nextFollowing }) {
  const targetId = normalizeId(targetUserId);

  queryClient.setQueriesData(
    { queryKey: feedHomeKeys.list(userId, 'recommended') },
    queryData => updateFollowState(queryData, targetUserId, nextFollowing),
  );

  if (!nextFollowing) {
    queryClient.setQueriesData(
      { queryKey: feedHomeKeys.list(userId, 'following') },
      queryData => removeUserFromFeed(queryData, targetUserId),
    );
  }

  queryClient.setQueriesData(
    { queryKey: feedDetailKeys.user(userId) },
    feed => {
      if (normalizeId(feed?.user?.userId) !== targetId) return feed;
      if (Boolean(feed.user.isFollowing) === nextFollowing) return feed;

      return { ...feed, user: { ...feed.user, isFollowing: nextFollowing } };
    },
  );
}

// 받아오던 목록이 낙관적 반영을 덮어쓰지 않게 먼저 취소한다. 첫 조회 중(데이터 없음)인 목록은 건드리지 않는다
const isLoadedQuery = query => query.state.data !== undefined;

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
