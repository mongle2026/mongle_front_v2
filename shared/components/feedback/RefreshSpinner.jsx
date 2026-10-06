import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '../../styles/color';

const PETAL_COUNT = 8;
export const REFRESH_SPINNER_SIZE = 24;
const PETAL_WIDTH = 2.5;
const PETAL_LENGTH = 7;
// 한 바퀴 도는 시간. 꽃잎 칸 단위로 끊어서 돈다
const SPIN_DURATION = 800;

// 맨 위 꽃잎이 가장 진하고, 시계 반대 방향으로 갈수록 흐려진다
const getPetalOpacity = index => {
  const stepsBehindHead = (PETAL_COUNT - index) % PETAL_COUNT;
  return Math.max(0.25, 1 - stepsBehindHead * 0.11);
};

const Petal = memo(({ index, progress }) => {
  // 당기는 만큼 맨 위부터 시계 방향으로 꽃잎이 하나씩 나타난다
  const revealStyle = useAnimatedStyle(() => ({
    opacity: progress.value * PETAL_COUNT > index ? 1 : 0,
  }));

  return (
    <Animated.View
      style={[
        styles.petalSlot,
        { transform: [{ rotate: `${(index * 360) / PETAL_COUNT}deg` }] },
        revealStyle,
      ]}
    >
      <View style={[styles.petal, { opacity: getPetalOpacity(index) }]} />
    </Animated.View>
  );
});

/**
 * iOS 기본 새로고침 모양의 꽃잎 스피너. Android 에서도 같은 모양으로 보이게 직접 그린다.
 *
 * @param {SharedValue<number>} progress 0~1. 보이는 꽃잎 비율
 * @param {SharedValue<boolean>} spinning true 면 돈다
 */
const RefreshSpinner = ({ progress, spinning, style }) => {
  const rotation = useSharedValue(0);

  useAnimatedReaction(
    () => spinning.value,
    (isSpinning, wasSpinning) => {
      if (isSpinning === wasSpinning) return;

      cancelAnimation(rotation);
      rotation.value = 0;

      if (isSpinning) {
        rotation.value = withRepeat(
          withTiming(360, { duration: SPIN_DURATION, easing: Easing.steps(PETAL_COUNT, false) }),
          -1,
          false
        );
      }
    }
  );

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.spinner, spinStyle, style]}>
      {Array.from({ length: PETAL_COUNT }, (_, index) => (
        <Petal key={index} index={index} progress={progress} />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  spinner: {
    width: REFRESH_SPINNER_SIZE,
    height: REFRESH_SPINNER_SIZE,
  },
  petalSlot: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
  },
  petal: {
    width: PETAL_WIDTH,
    height: PETAL_LENGTH,
    borderRadius: PETAL_WIDTH / 2,
    backgroundColor: colors.fgNeutralTertiary,
  },
});

export default memo(RefreshSpinner);
