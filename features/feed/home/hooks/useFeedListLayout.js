import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

import { gap } from '../../../../shared/styles/token';

// 현재 게시물 위 게시물이 살짝 보이는 정도 + 게시물 사이 간격
const PEEK_HEIGHT = gap.M;
const POST_GAP = gap.M;

/**
 * 게시물 수에 맞춘 스냅 위치.
 * 안드로이드는 게시물별 위치를 직접 계산한 snapToOffsets 를 쓴다. 각 값만 따로 버려서 오차가 쌓이지 않는다
 */
export const getSnapProps = (postCount, snapInterval) => {
  if (Platform.OS !== 'android' || snapInterval <= 0) {
    return { snapToInterval: snapInterval, snapToOffsets: undefined };
  }

  return {
    snapToInterval: undefined,
    snapToOffsets: Array.from({ length: postCount }, (_, index) => index * snapInterval),
  };
};

/**
 * 피드 홈 목록의 카드 높이 · 여백. 추천 · 팔로잉 목록이 같은 값을 쓴다
 * @param {object} params
 * @param {number} [params.reservedBottomSpace] 아래에서 가려지는 높이 (작성 FAB)
 */
const useFeedListLayout = ({ reservedBottomSpace = 0 } = {}) => {
  const [listHeight, setListHeight] = useState(0);

  // 남은 공간을 전부 PostCard가 차지하도록 화면 높이에서 고정 간격만큼 뺀 값을 카드 높이로 사용
  const viewportHeight = Math.max(listHeight - reservedBottomSpace, 0);
  const postCardHeight = Math.max(viewportHeight - PEEK_HEIGHT - POST_GAP, 0);
  const snapInterval = postCardHeight + POST_GAP;

  // 카드 높이가 모두 같으니 위치를 직접 알려줘서 다음 게시물이 정확히 FAB 뒤에 숨도록 한다
  const getItemLayout = useCallback(
    (_, index) => ({
      length: snapInterval,
      offset: PEEK_HEIGHT + POST_GAP + index * snapInterval,
      index,
    }),
    [snapInterval]
  );

  const handleListLayout = useCallback(event => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    setListHeight(currentHeight => (currentHeight === nextHeight ? currentHeight : nextHeight));
  }, []);

  return {
    postCardHeight,
    snapInterval,
    paddingTop: PEEK_HEIGHT + POST_GAP,
    paddingBottom: reservedBottomSpace,
    getItemLayout,
    handleListLayout,
  };
};

export default useFeedListLayout;
