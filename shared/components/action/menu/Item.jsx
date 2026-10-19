import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors } from '../../../styles/color';
import { gap, padding } from '../../../styles/token';
import { typo } from '../../../styles/typo';

const ICON_SIZE = 16;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// 누르면 배경이 바로 바뀌지 않고 짧게 물들고, 내용이 살짝 눌렸다가 돌아온다
const PRESS_IN_TIMING = { duration: 90, easing: Easing.out(Easing.quad) };
const PRESS_OUT_TIMING = { duration: 220, easing: Easing.out(Easing.cubic) };
const PRESSED_CONTENT_SCALE = 0.96;

const playPressHaptic = () => {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
    /* 햅틱을 지원하지 않는 환경에서도 메뉴 동작은 그대로 유지한다 */
  });
};

const Item = ({
  icon: Icon,
  label,
  color = colors.fgNeutralSecondary,
  onPress,
  disabled = false,
  iconProps,
  style,
  textStyle,
  accessibilityLabel = label,
}) => {
  // disabled 면 넘겨받은 color 대신 아이콘·글자 모두 fgDisabled
  const contentColor = disabled ? colors.fgDisabled : color;

  const pressProgress = useSharedValue(0);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      pressProgress.value,
      [0, 1],
      [colors.fillSurface, colors.fillSurfacePress],
    ),
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(pressProgress.value, [0, 1], [1, PRESSED_CONTENT_SCALE]) },
    ],
  }));

  const handlePressIn = useCallback(() => {
    pressProgress.value = withTiming(1, PRESS_IN_TIMING);
  }, [pressProgress]);

  const handlePressOut = useCallback(() => {
    pressProgress.value = withTiming(0, PRESS_OUT_TIMING);
  }, [pressProgress]);

  const handlePress = useCallback(
    event => {
      playPressHaptic();
      onPress?.(event);
    },
    [onPress],
  );

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        !disabled && containerAnimatedStyle,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Animated.View style={[styles.content, contentAnimatedStyle]}>
        {Icon && (
          <View style={styles.iconContainer}>
            <Icon
              width={ICON_SIZE}
              height={ICON_SIZE}
              color={contentColor}
              fill={contentColor}
              {...iconProps}
            />
          </View>
        )}
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            { color: contentColor },
            textStyle,
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    // 메뉴 폭만큼 채워서 항목마다 배경이 끝까지 칠해지고, 내용은 가운데에 온다
    alignSelf: 'stretch',
    paddingVertical: padding.XL,
    paddingHorizontal: padding.XXL,
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap.M,
    backgroundColor: colors.fillSurface,
  },
  // 아이콘 · 글자를 함께 살짝 눌리게 하려고 묶는다 (배치는 container 와 같게)
  content: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap.M,
  },
  disabled: {
    backgroundColor: colors.fillSurface,
  },
  iconContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    ...typo.suitLabelXLargeStrong,
    flexShrink: 1,
  },
});

export default memo(Item);