import React, { forwardRef, useCallback, useImperativeHandle, } from 'react';

import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming, } from 'react-native-reanimated';

import * as Haptics from 'expo-haptics';

import { colors } from '../../styles/color';
import LabeledButton from './LabeledButton';

export const ANIMATION_TYPE = {
  LIKE: 'LIKE',
  BOOKMARK: 'BOOKMARK',
};

const AnimatedIcon = ({
  Icon,
  animatedStyle,
  width,
  height,
  color,
}) => {
  return (
    <Animated.View style={animatedStyle}>
      <Icon
        width={width}
        height={height}
        color={color}
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
      activeColor,
      inactiveColor = colors.fgDeactivate,
      labelColor = colors.fgNeutralSubtlest,
      animationType,
      size = 'S',
      font = 'suit',
      disabled = false,
      onPress,
      accessibilityLabel,
      style,
    },
    ref,
  ) {
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
      transform:
        animationType === ANIMATION_TYPE.BOOKMARK
          ? [{ translateY: translateY.value }]
          : [{ scale: scale.value }],
    }));

    const playAnimation = useCallback(() => {
      Haptics.impactAsync(
        Haptics.ImpactFeedbackStyle.Light,
      );

      if (animationType === ANIMATION_TYPE.BOOKMARK) {
        translateY.value = withSequence(
          withTiming(2, {
            duration: 90,
          }),
          withSpring(0, {
            damping: 20,
            stiffness: 220,
          }),
        );

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
    }, [animationType, scale, translateY]);

    useImperativeHandle(
      ref,
      () => ({
        bounce: playAnimation,
      }),
      [playAnimation],
    );

    const handlePress = () => {
      if (disabled) return;

      playAnimation();
      onPress?.();
    };

    const Icon = isActive
      ? ActiveIcon
      : InactiveIcon;

    return (
      <LabeledButton
        label={label}
        size={size}
        font={font}
        icon={
          <AnimatedIcon
            Icon={Icon}
            animatedStyle={animatedStyle}
          />
        }
        color={labelColor}
        iconColor={
          isActive
            ? activeColor
            : inactiveColor
        }
        disabled={disabled}
        onPress={handlePress}
        accessibilityLabel={accessibilityLabel}
        style={style}
      />
    );
  },
);

export default AnimatedLabeledButton;