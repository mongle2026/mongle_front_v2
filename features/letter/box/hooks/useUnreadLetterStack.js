import { useCallback, useMemo, useState } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { clamp, Easing, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

// 이만큼 끌어야 편지가 완전히 펼쳐진다 (모을 때도 동일)
const DRAG_DISTANCE = 240;
// 손을 뗐을 때 이 비율 이상 진행했거나 빠르게 튕기면 반대 상태로 넘어간다
const SNAP_PROGRESS_THRESHOLD = 0.3;
const SNAP_VELOCITY = 500;
const SNAP_TIMING = { duration: 320, easing: Easing.out(Easing.cubic) };

// 세로로 이만큼 움직여야 드래그로 인식, 가로로 이만큼 움직이면 취소 (상위 탭 스와이프 등과 충돌 방지)
const ACTIVE_OFFSET_Y = 10;
const FAIL_OFFSET_X = 20;

/**
 * 안 읽음 편지 더미의 모음/펼침 상태를 관리한다.
 * progress: 0 = 모아짐, 1 = 펼쳐짐
 *
 * - 모아진 상태: 스크롤을 막고, 화면을 내리면(손가락을 위로) 편지가 점점 펼쳐진다
 * - 펼쳐진 상태: 자유롭게 스크롤하고, 최상단에서 화면을 올리면(손가락을 아래로) 다시 모아진다
 *
 * @param {(event: object) => void} [onScroll] 스크롤 이벤트를 함께 받을 콜백 (페이지네이션)
 */
const useUnreadLetterStack = ({ onScroll } = {}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const progress = useSharedValue(0);
  const startProgress = useSharedValue(0);
  const scrollY = useSharedValue(0);
  // 드래그가 실제로 모음/펼침을 움직이는 중인지 (펼친 상태에선 최상단에서 시작했을 때만)
  const isDragging = useSharedValue(false);
  const isStartedAtTop = useSharedValue(true);

  const animateTo = useCallback(
    target => {
      'worklet';
      progress.value = withTiming(target, SNAP_TIMING, finished => {
        if (finished) scheduleOnRN(setIsExpanded, target === 1);
      });
    },
    [progress]
  );

  const panGesture = useMemo(() => {
    // 탭처럼 활성화되지 않고 끝난 터치는 isDragging 이 false 라 아무것도 하지 않는다
    return Gesture.Pan()
      .activeOffsetY(isExpanded ? ACTIVE_OFFSET_Y : -ACTIVE_OFFSET_Y)
      .failOffsetX([-FAIL_OFFSET_X, FAIL_OFFSET_X])
      .onBegin(() => {
        // 드래그를 시작한 순간 스크롤이 최상단이어야 모으기로 동작한다
        isStartedAtTop.value = scrollY.value <= 0;
      })
      .onStart(() => {
        isDragging.value = !isExpanded || isStartedAtTop.value;
        startProgress.value = progress.value;
      })
      .onUpdate(event => {
        if (!isDragging.value) return;
        // 손가락을 위로 올릴수록(translationY 음수) 펼쳐진다
        progress.value = clamp(startProgress.value - event.translationY / DRAG_DISTANCE, 0, 1);
      })
      .onFinalize(event => {
        if (!isDragging.value) return;
        isDragging.value = false;

        if (isExpanded) {
          const shouldCollapse =
            progress.value < 1 - SNAP_PROGRESS_THRESHOLD || event.velocityY > SNAP_VELOCITY;
          animateTo(shouldCollapse ? 0 : 1);
          return;
        }

        const shouldExpand = progress.value > SNAP_PROGRESS_THRESHOLD || -event.velocityY > SNAP_VELOCITY;
        animateTo(shouldExpand ? 1 : 0);
      });
  }, [animateTo, isDragging, isExpanded, isStartedAtTop, progress, scrollY, startProgress]);

  // ScrollView 의 네이티브 스크롤과 동시에 인식해야 최상단 판정과 스크롤이 함께 동작한다
  const gesture = useMemo(() => Gesture.Simultaneous(panGesture, Gesture.Native()), [panGesture]);

  const handleScroll = useCallback(
    event => {
      scrollY.value = event.nativeEvent.contentOffset.y;
      onScroll?.(event);
    },
    [onScroll, scrollY]
  );

  return {
    isExpanded,
    progress,
    gesture,
    handleScroll,
  };
};

export default useUnreadLetterStack;
