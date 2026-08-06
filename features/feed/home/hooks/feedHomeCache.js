const normalizeId = value =>
  String(value);

export const FEED_HOME_QUERY_ROOT = [
  'feed-home',
];

export const feedHomeKeys = {
  all: FEED_HOME_QUERY_ROOT,

  user: userId => [
    ...FEED_HOME_QUERY_ROOT,
    normalizeId(userId),
  ],

  list: (
    userId,
    feedType,
  ) => [
    ...FEED_HOME_QUERY_ROOT,
    normalizeId(userId),
    feedType,
  ],
};

/**
 * useInfiniteQuery 캐시 안에서
 * 특정 feedId에 해당하는 게시물만 수정합니다.
 */
export function updateFeedItem(
  queryData,
  feedId,
  updater,
) {
  if (!queryData?.pages) {
    return queryData;
  }

  const normalizedFeedId =
    normalizeId(feedId);

  let hasChanged = false;

  const nextPages =
    queryData.pages.map(page => {
      if (
        !Array.isArray(page?.items)
      ) {
        return page;
      }

      const nextItems =
        page.items.map(item => {
          if (
            normalizeId(
              item?.feedId,
            ) !== normalizedFeedId
          ) {
            return item;
          }

          hasChanged = true;

          return updater(item);
        });

      return {
        ...page,
        items: nextItems,
      };
    });

  if (!hasChanged) {
    return queryData;
  }

  return {
    ...queryData,
    pages: nextPages,
  };
}

/**
 * 특정 useInfiniteQuery 캐시에서
 * feedId에 해당하는 게시물을 찾습니다.
 */
export function findFeedItem(
  queryData,
  feedId,
) {
  if (!queryData?.pages) {
    return null;
  }

  const normalizedFeedId =
    normalizeId(feedId);

  for (
    const page of queryData.pages
  ) {
    const item =
      page?.items?.find(feed =>
        normalizeId(
          feed?.feedId,
        ) === normalizedFeedId,
      );

    if (item) {
      return item;
    }
  }

  return null;
}