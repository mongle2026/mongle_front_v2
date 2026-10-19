import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '../../../styles/color';
import { padding, radius } from '../../../styles/token';
import { typo } from '../../../styles/typo';

const PRESSED_SCALE = 0.95;

/*
 * activePosition 이 있으면 활성 칩 배경은 Tabs 가 미끄러지게 그리고,
 * 이 탭은 칩이 다가오는 만큼 글자색만 바꾼다. 측정 전(activePosition 없음)에는 isActive 로 바로 그린다.
 */
const Items = ({
  label,
  index = 0,
  isActive = false,
  activePosition = null,
  onPress,
  onLayout,
  accessibilityLabel = label,
  style,
}) => {
  const pressScale = useSharedValue(1);
  const isSliding = Boolean(activePosition);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = { transform: [{ scale: pressScale.value }] };

    if (!activePosition) return scale;

    const activeAmount = interpolate(
      Math.abs(activePosition.value - index),
      [0, 1],
      [1, 0],
      'clamp',
    );

    return {
      ...scale,
      color: interpolateColor(
        activeAmount,
        [0, 1],
        [colors.fgNeutralPrimary, colors.fgNeutralInverted],
      ),
    };
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        pressScale.value = withTiming(PRESSED_SCALE, { duration: 90 });
      }}
      onPressOut={() => {
        pressScale.value = withTiming(1, { duration: 160 });
      }}
      onLayout={onLayout}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: isActive }}
      style={[styles.wrapper, style]}
    >
      <Animated.Text
        numberOfLines={1}
        style={[
          styles.item,
          isSliding
            ? styles.itemSliding
            : isActive
              ? styles.itemActive
              : styles.itemInactive,
          animatedStyle,
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
    padding: padding.XXS,
    justifyContent: 'center',
    alignItems: 'center',
  },

  item: {
    paddingVertical: padding.XS,
    paddingHorizontal: padding.M,
    textAlign: 'center',
    borderRadius: radius.XS,
    overflow: 'hidden',
    ...typo.suitLabelLarge,
  },

  itemInactive: {
    color: colors.fgNeutralPrimary,
  },

  // 칩 배경은 Tabs 가 따로 그린다
  itemSliding: {
    color: colors.fgNeutralPrimary,
  },

  itemActive: {
    backgroundColor: colors.fillNeutralStrong,
    color: colors.fgNeutralInverted,
  },
});

export default memo(Items);
