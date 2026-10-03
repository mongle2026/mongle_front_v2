import apiClient from './client';

// 커서 페이지네이션 목록 공통.
// 서버 응답: { items, nextCursor, hasNext } / 첫 페이지는 cursor 파라미터 없이 요청한다.

export const withCursor = (params, cursor) =>
  cursor === null || cursor === undefined ? params : { ...params, cursor };

// mapItem 이 있으면 item 을 변환하고, null 을 돌려준 item 은 뺀다
export function toCursorPage(data, mapItem) {
  const rawItems = Array.isArray(data?.items) ? data.items : [];

  return {
    items: mapItem ? rawItems.map(mapItem).filter(Boolean) : rawItems,
    nextCursor: data?.nextCursor ?? null,
    hasNext: Boolean(data?.hasNext),
  };
}

export async function fetchCursorPage(path, { params, cursor, mapItem } = {}) {
  const response = await apiClient.get(path, { params: withCursor(params, cursor) });
  return toCursorPage(response.data, mapItem);
}

// useInfiniteQuery 의 getNextPageParam
export const getNextCursor = lastPage =>
  lastPage?.hasNext ? lastPage.nextCursor ?? undefined : undefined;

// 받아 둔 페이지들을 한 목록으로 펼친다
export const flattenPages = pages => pages?.flatMap(page => page.items) ?? [];
