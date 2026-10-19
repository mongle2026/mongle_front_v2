import React, { forwardRef, useCallback, useImperativeHandle, } from 'react';

import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming, } from 'react-native-reanimated';

import * as Haptics from 'expo-haptics';

import { colors } from '../../styles/color';
import LabeledButton from './LabeledButton';

// LIKE: 아이콘이 통통 튄다 / BOOKMARK: 아이콘 애니메이션 없이 햅틱만 (눌림 효과는 바깥에서 건다)
export const ANIMATION_TYPE = Object.freeze({
  LIKE: 'LIKE',
  BOOKMARK: 'BOOKMARK',
});

const AnimatedIcon = ({
  Icon,
  animatedStyle,
  size,
  color,
}) => {
  if (!Icon) {
    return null;
  }

  return (
    <Animated.View style={animatedStyle}>
      <Icon
        width={size}
        height={size}
        color={color}
        fill={color}
      />
    </Animated.View>
  );
};

const AnimatedLabeledButton = forwardRef(
  function AnimatedLabeledButton(
    {
      label,
      isActive = false,

      activeIcon: ActiveIcon,
      inactiveIcon: InactiveIcon,

      activeColor = colors.fgNeutralPrimary,
      inactiveColor = colors.fgNeutralQuaternary,
      labelColor = colors.fgNeutralQuaternary,

      animationType = ANIMATION_TYPE.LIKE,

      size = 'S',

      disabled = false,
      onPress,
      accessibilityLabel,
      style,
      // onPressIn / onPressOut 등은 LabeledButton(Pressable) 에 그대로 넘긴다 (예: 바깥 눌림 효과)
      ...pressableProps
    },
    ref,
  ) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {
            scale: scale.value,
          },
        ],
      };
    });

    const playHaptic = useCallback(() => {
      void Haptics.impactAsync(
        Haptics.ImpactFeedbackStyle.Light,
      ).catch(() => {
        /*
         * 햅틱을 지원하지 않는 환경에서도
         * 버튼 동작 자체는 유지합니다.
         */
      });
    }, []);

    const playAnimation =
      useCallback(() => {
        playHaptic();

        if (
          animationType ===
          ANIMATION_TYPE.BOOKMARK
        ) {
          return;
        }

        scale.value = withSequence(
          withTiming(0.85, {
            duration: 90,
          }),
          withTiming(1.15, {
            duration: 130,
          }),
          withTiming(1, {
            duration: 130,
          }),
        );
      }, [
        animationType,
        playHaptic,
        scale,
      ]);

    useImperativeHandle(
      ref,
      () => ({
        bounce: playAnimation,
      }),
      [playAnimation],
    );

    const handlePress =
      useCallback(() => {
        if (disabled) {
          return;
        }

        playAnimation();
        onPress?.();
      }, [
        disabled,
        onPress,
        playAnimation,
      ]);

    const Icon = isActive
      ? ActiveIcon
      : InactiveIcon;

    const resolvedIconColor =
      isActive
        ? activeColor
        : inactiveColor;

    return (
      <LabeledButton
        {...pressableProps}
        label={label}
        size={size}
        renderIcon={({ size: iconSize, color }) => (
          <AnimatedIcon
            Icon={Icon}
            animatedStyle={animatedStyle}
            size={iconSize}
            color={color}
          />
        )}
        color={labelColor}
        iconColor={resolvedIconColor}
        disabled={disabled}
        onPress={handlePress}
        accessibilityLabel={
          accessibilityLabel
        }
        style={style}
      />
    );
  },
);

export default AnimatedLabeledButton;