import { useCallback, useMemo, useRef } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const PRESSED_SCALE = 0.99;
const PRESSED_TRANSLATE_Y = 1;
const PRESS_IN_DURATION = 90;
const PRESS_MOVE_THRESHOLD = 8;

const PRESS_OUT_SPRING_CONFIG = {
  damping: 18,
  stiffness: 260,
  mass: 0.5,
  overshootClamping: true,
};

// 카드를 누르는 동안 살짝 눌리는 효과.
// 누른 채로 PRESS_MOVE_THRESHOLD 이상 움직이면 스크롤로 보고 onPress를 부르지 않는다.
// animatedStyle: Animated.View에 넣을 style
// pressHandlers: Pressable에 펼쳐 넣을 핸들러. onPress가 없으면 눌림 효과도 걸지 않는다
const usePressAnimation = ({ onPress } = {}) => {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const pressStartRef = useRef(null);
  const didMoveRef = useRef(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const handlePressIn = useCallback(event => {
    const { pageX, pageY } = event.nativeEvent;

    pressStartRef.current = { x: pageX, y: pageY };
    didMoveRef.current = false;

    scale.value = withTiming(PRESSED_SCALE, { duration: PRESS_IN_DURATION });
    translateY.value = withTiming(PRESSED_TRANSLATE_Y, { duration: PRESS_IN_DURATION });
  }, [scale, translateY]);

  const handlePressMove = useCallback(event => {
    const start = pressStartRef.current;

    if (!start || didMoveRef.current) return;

    const { pageX, pageY } = event.nativeEvent;
    const distance = Math.hypot(pageX - start.x, pageY - start.y);

    if (distance >= PRESS_MOVE_THRESHOLD) {
      didMoveRef.current = true;
    }
  }, []);

  const handlePress = useCallback(event => {
    const didMove = didMoveRef.current;

    pressStartRef.current = null;
    didMoveRef.current = false;

    if (didMove) return;

    onPress?.(event);
  }, [onPress]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, PRESS_OUT_SPRING_CONFIG);
    translateY.value = withSpring(0, PRESS_OUT_SPRING_CONFIG);
  }, [scale, translateY]);

  const isPressable = typeof onPress === 'function';

  const pressHandlers = useMemo(() => (
    isPressable
      ? {
        onPress: handlePress,
        onPressIn: handlePressIn,
        onPressMove: handlePressMove,
        onPressOut: handlePressOut,
      }
      : {}
  ), [handlePress, handlePressIn, handlePressMove, handlePressOut, isPressable]);

  return {
    animatedStyle,
    pressHandlers,
  };
};

export default usePressAnimation;
