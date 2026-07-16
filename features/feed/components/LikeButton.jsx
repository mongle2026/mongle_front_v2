import { forwardRef, useImperativeHandle } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { palette } from '../../../shared/styles/color';
import { radius } from '../../../shared/styles/token';
import HeartStroke from '../../../assets/icons/ic_heart_stroke.svg';
import HeartFill from '../../../assets/icons/ic_heart_fill.svg';

// ButtonIcon size="L" 과 동일한 히트영역/아이콘 크기
const BUTTON_SIZE = 40;
const ICON_SIZE = 20;

// 누르면 하트가 살짝 작아졌다가(0.85) 커지고(1.15) 원래대로(1.0) 돌아오며 색이 채워진다.
// ref.bounce() 로 외부(더블탭 등)에서도 동일한 애니메이션 + 햅틱을 재생할 수 있다.
const LikeButton = forwardRef(function LikeButton(
  { isLiked = false, onPress, disabled = false },
  ref,
) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bounce = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // press → scale 0.85 → scale 1.15 → scale 1.0
    scale.value = withSequence(
      withTiming(0.85, { duration: 90 }),
      withTiming(1.15, { duration: 130 }),
      withTiming(1, { duration: 130 }),
    );
  };

  useImperativeHandle(ref, () => ({ bounce }), []);

  const handlePress = () => {
    if (disabled) return;
    bounce();
    onPress?.();
  };

  const Icon = isLiked ? HeartFill : HeartStroke;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      hitSlop={8}
      style={styles.button}
    >
      <Animated.View style={animatedStyle}>
        <Icon
          width={ICON_SIZE}
          height={ICON_SIZE}
          color={isLiked ? palette.pink[50] : palette.gray[30]}
        />
      </Animated.View>
    </Pressable>
  );
});

export default LikeButton;

const styles = StyleSheet.create({
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: radius.XS,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
