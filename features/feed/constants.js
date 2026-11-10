// 피드 홈 상단 탭 (추천 / 최신 / 팔로잉). key 는 피드 목록 종류(feedType)와 같다
export const FEED_TAB = {
  RECOMMENDED: 'recommended',
  LATEST: 'latest',
  FOLLOWING: 'following',
};

export const FEED_TOP_NAVIGATION_TABS = [
  { key: FEED_TAB.RECOMMENDED, label: '추천', accessibilityLabel: '추천 피드 보기' },
  { key: FEED_TAB.LATEST, label: '최신', accessibilityLabel: '최신 피드 보기' },
  { key: FEED_TAB.FOLLOWING, label: '팔로잉', accessibilityLabel: '팔로잉 피드 보기' },
];

// 탭마다 부르는 서버 목록.
// 추천: 추천 알고리즘. 커서가 문자열이고, 처음부터 다시 받으면 순서가 새로 섞인다. 본인 글은 나오지 않는다
// 최신: 최신순. 본인 글도 나온다
export const FEED_PATH_BY_TAB = {
  [FEED_TAB.RECOMMENDED]: '/feed/recommended',
  [FEED_TAB.LATEST]: '/feed',
  [FEED_TAB.FOLLOWING]: '/feed/following',
};
