import {
  applyBookmarkFollowState,
  cancelLoadedBookmarkQueries,
  refreshBookmarkFollowingFeeds,
  revertBookmarkFollowState,
} from '../../archive/api/bookmarkCache';
import { archiveKeys } from '../../archive/api/archiveKeys';
import { profileKeys } from '../../profile/api/profileKeys';
import {
  findInfiniteItem,
  isLoadedQuery,
  mapInfiniteItems,
  removeInfiniteItems,
  withAuthorFollowing,
} from '../../../shared/api/infiniteCache';
import { isSameId, toIdKey } from '../../../shared/utils/id';

import { fetchFeedDetail } from './fetchFeedDetail';

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

// 홈(추천/최신/팔로잉) 목록과 상세 캐시에 있는 같은 피드를 함께 바꾼다
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

/*
 * 신고한 피드를 서버에서 다시 받아, 그 사이 운영자가 가렸는지 본다.
 * 가렸으면 홈 목록의 그 피드를 가림 카드로 바꾼다. 서버는 가린 글을 목록에서 빼므로
 * 다음에 목록을 다시 받으면 가림 카드도 사라진다.
 * 북마크 · 작성자 프로필 커버도 다시 받게 해서 가린 글이 남아 보이지 않게 한다.
 * 실패해도 신고는 이미 끝났으므로 조용히 넘어간다
 */
export async function syncReportedFeed(queryClient, { userId, feedId }) {
  try {
    const feed = await queryClient.fetchQuery({
      queryKey: feedDetailKeys.detail(userId, feedId),
      queryFn: () => fetchFeedDetail(feedId),
      staleTime: 0,
    });

    if (!feed?.isBlinded) return;

    updateFeedInAllCaches(queryClient, userId, feedId, item => ({ ...item, isBlinded: true }));

    queryClient.invalidateQueries({ queryKey: archiveKeys.bookmark(userId) });
    queryClient.invalidateQueries({ queryKey: profileKeys.userCovers(userId, feed.user?.userId) });
  } catch (error) {
    console.warn('신고한 피드를 다시 불러오지 못했습니다.', error);
  }
}

// 팔로우 상태를 홈(추천/최신/팔로잉)·상세 캐시에 반영한다. 보관함 북마크는 bookmarkCache 에서 따로 맞춘다.
// 팔로잉 피드는 언팔로우면 그 사람 글을 빼고, 팔로우면 넣을 글 데이터가 없으니 서버 반영 후 다시 받는다
function writeFollowState(queryClient, { userId, targetUserId, nextFollowing }) {
  ['recommended', 'latest'].forEach(feedType => {
    queryClient.setQueriesData(
      { queryKey: feedHomeKeys.list(userId, feedType) },
      queryData => mapInfiniteItems(queryData, item => withAuthorFollowing(item, targetUserId, nextFollowing)),
    );
  });

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

  // 다른 사람 프로필의 팔로우 상태도 같이 바꿔서, 피드에서 팔로우한 뒤 프로필에 가도 맞게 보이게 한다
  queryClient.setQueryData(
    profileKeys.followStatus(userId, targetUserId),
    status => (status ? { ...status, isFollowing: nextFollowing } : status),
  );
}

// 서버 응답 전에 팔로우 상태를 화면에 반영한다
export async function applyFollowState(queryClient, { userId, targetUserId, nextFollowing }) {
  await Promise.all([
    queryClient.cancelQueries({ queryKey: feedHomeKeys.user(userId), predicate: isLoadedQuery }),
    queryClient.cancelQueries({ queryKey: feedDetailKeys.user(userId), predicate: isLoadedQuery }),
    cancelLoadedBookmarkQueries(queryClient, userId),
    queryClient.cancelQueries({ queryKey: profileKeys.followStatus(userId, targetUserId) }),
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

// 팔로우 여부에 따라 보이는 글(팔로워 공개)이 달라지므로 그 사람 프로필의 커버 그리드를 다시 받게 한다
export function refreshUserCovers(queryClient, { userId, targetUserId }) {
  queryClient.invalidateQueries({ queryKey: profileKeys.userCovers(userId, targetUserId) });
}

// 팔로우 요청이 실패하면 되돌린다. 언팔로우로 뺀 글은 캐시에 남아 있지 않으니 다시 받는다
export function revertFollowState(queryClient, { userId, targetUserId, nextFollowing }) {
  writeFollowState(queryClient, { userId, targetUserId, nextFollowing: !nextFollowing });

  if (!nextFollowing) {
    queryClient.invalidateQueries({ queryKey: feedHomeKeys.list(userId, 'following') });
  }

  revertBookmarkFollowState(queryClient, { userId, targetUserId, nextFollowing });
}
