// 피드 홈 상단 탭 (추천 / 팔로잉). key 는 피드 목록 종류(feedType)와 같다
export const FEED_TAB = {
  RECOMMENDED: 'recommended',
  FOLLOWING: 'following',
};

export const FEED_TOP_NAVIGATION_TABS = [
  { key: FEED_TAB.RECOMMENDED, label: '추천', accessibilityLabel: '추천 피드 보기' },
  { key: FEED_TAB.FOLLOWING, label: '팔로잉', accessibilityLabel: '팔로잉 피드 보기' },
];
