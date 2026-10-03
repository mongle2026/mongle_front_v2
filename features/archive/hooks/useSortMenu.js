import { useCallback, useMemo, useState } from 'react';

/*
 * 보관함 목록(북마크 / 장르 상세)의 정렬 메뉴 상태.
 * ListControlBar("최신순 ▾")를 누르면 그 아래에 Menu 를 띄우고, 항목을 고르면 정렬을 바꾸고 닫는다.
 * 메뉴 위치는 화면마다 계산 방식이 달라서(고정 바 / 같이 스크롤되는 헤더) openSortMenu(top) 으로 받는다.
 *
 * options: [{ key, label }] — 첫 번째가 기본 정렬
 */
const useSortMenu = options => {
  const [sortKey, setSortKey] = useState(options[0].key);
  // null 이면 닫힘
  const [sortMenuTop, setSortMenuTop] = useState(null);

  const openSortMenu = useCallback(top => setSortMenuTop(top), []);
  const closeSortMenu = useCallback(() => setSortMenuTop(null), []);

  const sortMenuItems = useMemo(
    () => options.map(option => ({
      key: option.key,
      label: option.label,
      onPress: () => {
        setSortKey(option.key);
        setSortMenuTop(null);
      },
    })),
    [options],
  );

  const sortLabel = options.find(option => option.key === sortKey)?.label ?? '';

  return {
    sortKey,
    sortLabel,
    isSortMenuOpen: sortMenuTop !== null,
    sortMenuTop,
    openSortMenu,
    closeSortMenu,
    sortMenuItems,
  };
};

export default useSortMenu;
