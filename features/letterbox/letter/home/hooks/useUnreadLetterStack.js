import { clamp, useAnimatedScrollHandler, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

// 이만큼 스크롤하면 편지가 완전히 펼쳐진다 (위로 되돌아오면 같은 거리에서 다시 모아진다)
export const EXPAND_SCROLL_DISTANCE = 300;

/**
 * 안 읽음 편지 더미의 펼침 정도를 스크롤 위치에 연결한다.
 * progress: 0 = 모아짐, 1 = 펼쳐짐
 *
 * - 스크롤 0 ~ EXPAND_SCROLL_DISTANCE: 편지 더미는 화면에 고정된 채 스크롤한 만큼 펼쳐진다
 * - 그 이후: 펼쳐진 목록을 자유롭게 스크롤한다
 * - 목록 최상단에서 더 올리면 올린 만큼 다시 모아진다
 *
 * @param {() => void} [onEndReached] 목록 끝 가까이 오면 호출 (페이지네이션)
 * @param {number} [endReachedThreshold] 끝에서 화면 높이의 이 비율 이내로 오면 onEndReached
 */
const useUnreadLetterStack = ({ onEndReached, endReachedThreshold = 0.4 } = {}) => {
  const scrollY = useSharedValue(0);

  // 끝에 닿은 동안 매 프레임 호출되지 않도록, 끝 근처에 들어올 때 한 번만 부른다
  const isNearEnd = useSharedValue(false);

  const progress = useDerivedValue(() => clamp(scrollY.value / EXPAND_SCROLL_DISTANCE, 0, 1));

  // 펼쳐지는 동안 편지 더미가 스크롤을 따라 올라가지 않도록 스크롤한 만큼 되돌려 고정한다
  const stickyOffset = useDerivedValue(() => Math.min(scrollY.value, EXPAND_SCROLL_DISTANCE));

  // 끝까지 남은 거리 계산은 UI 스레드(worklet)에서 하고,
  // 페이지를 더 불러와야 할 때만 JS를 부른다 (스크롤 중 매 프레임 JS 호출 방지)
  const scrollHandler = useAnimatedScrollHandler(
    event => {
      scrollY.value = event.contentOffset.y;

      if (!onEndReached) return;

      const { contentOffset, contentSize, layoutMeasurement } = event;
      const distanceFromEnd = contentSize.height - (contentOffset.y + layoutMeasurement.height);
      const nearEnd = distanceFromEnd <= layoutMeasurement.height * endReachedThreshold;

      if (nearEnd && !isNearEnd.value) {
        scheduleOnRN(onEndReached);
      }

      isNearEnd.value = nearEnd;
    },
    [onEndReached, endReachedThreshold]
  );

  return {
    progress,
    stickyOffset,
    scrollHandler,
  };
};

export default useUnreadLetterStack;
