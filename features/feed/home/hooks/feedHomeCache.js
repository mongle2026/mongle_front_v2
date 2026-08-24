const normalizeId = value => String(value);

export const FEED_HOME_QUERY_ROOT = ['feed-home'];

export const feedHomeKeys = {
  all: FEED_HOME_QUERY_ROOT,
  user: userId => [...FEED_HOME_QUERY_ROOT, normalizeId(userId)],
  list: (userId, feedType) => [...FEED_HOME_QUERY_ROOT, normalizeId(userId), feedType],
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