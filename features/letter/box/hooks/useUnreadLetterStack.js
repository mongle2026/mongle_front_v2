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
 * @param {(event: object) => void} [onScroll] 스크롤 이벤트를 함께 받을 콜백 (페이지네이션)
 */
const useUnreadLetterStack = ({ onScroll } = {}) => {
  const scrollY = useSharedValue(0);

  const progress = useDerivedValue(() => clamp(scrollY.value / EXPAND_SCROLL_DISTANCE, 0, 1));

  // 펼쳐지는 동안 편지 더미가 스크롤을 따라 올라가지 않도록 스크롤한 만큼 되돌려 고정한다
  const stickyOffset = useDerivedValue(() => Math.min(scrollY.value, EXPAND_SCROLL_DISTANCE));

  const scrollHandler = useAnimatedScrollHandler(
    event => {
      scrollY.value = event.contentOffset.y;

      if (onScroll) {
        const { contentOffset, contentSize, layoutMeasurement } = event;
        scheduleOnRN(onScroll, { nativeEvent: { contentOffset, contentSize, layoutMeasurement } });
      }
    },
    [onScroll]
  );

  return {
    progress,
    stickyOffset,
    scrollHandler,
  };
};

export default useUnreadLetterStack;
