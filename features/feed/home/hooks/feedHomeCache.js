const normalizeId = value => String(value);

export const FEED_HOME_QUERY_ROOT = ['feed-home'];

export const feedHomeKeys = {
  all: FEED_HOME_QUERY_ROOT,
  user: userId => [...FEED_HOME_QUERY_ROOT, normalizeId(userId)],
  list: (userId, feedType) => [...FEED_HOME_QUERY_ROOT, normalizeId(userId), feedType],
};

export const FEED_DETAIL_QUERY_ROOT = ['feed-detail'];

export const feedDetailKeys = {
  all: FEED_DETAIL_QUERY_ROOT,
  user: userId => [...FEED_DETAIL_QUERY_ROOT, normalizeId(userId)],
  detail: (userId, feedId) => [...FEED_DETAIL_QUERY_ROOT, normalizeId(userId), normalizeId(feedId)],
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

// 팔로우 결과를 홈(추천/팔로잉)과 상세 캐시에 함께 반영한다.
export function syncFollowState(queryClient, { userId, targetUserId, nextFollowing }) {
  const targetId = normalizeId(targetUserId);

  queryClient.setQueriesData(
    { queryKey: feedHomeKeys.list(userId, 'recommended') },
    queryData => updateFollowState(queryData, targetUserId, nextFollowing),
  );

  if (nextFollowing) {
    queryClient.invalidateQueries({
      queryKey: feedHomeKeys.list(userId, 'following'),
      refetchType: 'none',
    });
  } else {
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
