// 보관함 탭. route.params.tab 으로 열 탭을 지정할 때도 쓴다 (예: 피드 북마크 토스트의 '이동')
export const ARCHIVE_TAB = {
  MYFEED: 'myfeed',
  BOOKMARK: 'bookmark',
};

// 보관함 상단 탭. 화면 안의 탭 구분은 Tabs 에서 하므로 보관함 탭 하나만 노출
export const ARCHIVE_TOP_NAVIGATION_TABS = [
  { key: 'archive', label: '보관함' },
];
