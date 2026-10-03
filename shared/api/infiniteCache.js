import { isSameId } from '../utils/id';

// useInfiniteQuery 캐시({ pages: [{ items }] })의 item을 바꾸거나 빼는 함수들.
// 바뀐 것이 없으면 원래 객체를 그대로 돌려줘서, 그 페이지를 쓰는 화면이 다시 그려지지 않게 한다.

// mapItem 이 원래 item 을 그대로 돌려주면 바뀌지 않은 것으로 본다
export function mapInfiniteItems(queryData, mapItem) {
  if (!queryData?.pages) return queryData;

  let hasChanged = false;

  const nextPages = queryData.pages.map(page => {
    if (!Array.isArray(page?.items)) return page;

    let pageChanged = false;
    const nextItems = page.items.map(item => {
      const nextItem = mapItem(item);
      if (nextItem !== item) pageChanged = true;
      return nextItem;
    });

    if (!pageChanged) return page;

    hasChanged = true;
    return { ...page, items: nextItems };
  });

  return hasChanged ? { ...queryData, pages: nextPages } : queryData;
}

export function removeInfiniteItems(queryData, shouldRemove) {
  if (!queryData?.pages) return queryData;

  let hasChanged = false;

  const nextPages = queryData.pages.map(page => {
    if (!Array.isArray(page?.items)) return page;

    const nextItems = page.items.filter(item => !shouldRemove(item));
    if (nextItems.length === page.items.length) return page;

    hasChanged = true;
    return { ...page, items: nextItems };
  });

  return hasChanged ? { ...queryData, pages: nextPages } : queryData;
}

export function findInfiniteItem(queryData, predicate) {
  if (!queryData?.pages) return null;

  for (const page of queryData.pages) {
    const item = page?.items?.find(predicate);
    if (item) return item;
  }

  return null;
}

// 피드 아이템({ user: { userId, isFollowing } })의 작성자 팔로우 상태를 바꾼다. 피드 홈·상세·북마크 캐시가 같이 쓴다
export function withAuthorFollowing(item, targetUserId, nextFollowing) {
  if (!isSameId(item?.user?.userId, targetUserId)) return item;
  if (Boolean(item.user.isFollowing) === nextFollowing) return item;

  return { ...item, user: { ...item.user, isFollowing: nextFollowing } };
}

// 받아오던 목록이 낙관적 반영을 덮어쓰지 않게 취소할 때, 첫 조회 중(데이터 없음)인 목록은 건드리지 않는다
export const isLoadedQuery = query => query.state.data !== undefined;
