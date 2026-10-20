import { memo, useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '../../../styles/color';
import { padding, radius } from '../../../styles/token';
import { typo } from '../../../styles/typo';

const ACTIVE_TIMING = { duration: 240, easing: Easing.out(Easing.cubic) };
const PRESSED_SCALE = 0.94;

// Figma 컴포넌트: navigation/TopNavigationItem (isActive)
// 탭을 바꾸면 글자색이 회색 ↔ 검정으로 부드럽게 바뀌고, 누르는 동안 살짝 작아진다
const Item = ({
  label,
  isActive = false,
  onPress,
  accessibilityLabel,
  style,
}) => {
  const activeProgress = useSharedValue(isActive ? 1 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    activeProgress.value = withTiming(isActive ? 1 : 0, ACTIVE_TIMING);
  }, [isActive, activeProgress]);

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      activeProgress.value,
      [0, 1],
      [colors.fgNeutralQuaternary, colors.fgNeutralPrimary],
    ),
    transform: [{ scale: pressScale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? String(label)}
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      onPressIn={() => {
        pressScale.value = withTiming(PRESSED_SCALE, { duration: 90 });
      }}
      onPressOut={() => {
        pressScale.value = withTiming(1, { duration: 180 });
      }}
      style={[styles.container, style]}
    >
      <Animated.Text
        numberOfLines={1}
        style={[
          styles.label,
          isActive ? styles.activeLabel : styles.inactiveLabel,
          labelAnimatedStyle,
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.XS,
  },

  label: {
    ...typo.suitTitleXLargeStrong,
    textAlign: 'center',
  },

  activeLabel: {
    color: colors.fgNeutralPrimary,
  },

  inactiveLabel: {
    color: colors.fgNeutralQuaternary,
  },
});

export default memo(Item);