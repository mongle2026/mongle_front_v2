import React, { forwardRef, useCallback, useImperativeHandle, } from 'react';

import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming, } from 'react-native-reanimated';

import * as Haptics from 'expo-haptics';

import { colors } from '../../styles/color';
import LabeledButton from './LabeledButton';

export const ANIMATION_TYPE = Object.freeze({
  LIKE: 'LIKE',
  BOOKMARK: 'BOOKMARK',
});

const AnimatedIcon = ({
  Icon,
  animatedStyle,
  width,
  height,
  color,
  fill,
}) => {
  if (!Icon) {
    return null;
  }

  const resolvedColor =
    color ??
    fill ??
    colors.fgNeutralWeak;

  return (
    <Animated.View style={animatedStyle}>
      <Icon
        width={width}
        height={height}
        color={resolvedColor}
        fill={resolvedColor}
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

      activeColor = colors.fgNeutralSolid,
      inactiveColor = colors.fgNeutralWeak,
      labelColor = colors.fgNeutralWeak,

      animationType = ANIMATION_TYPE.LIKE,

      size = 'S',

      disabled = false,
      onPress,
      accessibilityLabel,
      style,
    },
    ref,
  ) {
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => {
      if (
        animationType ===
        ANIMATION_TYPE.BOOKMARK
      ) {
        return {
          transform: [
            {
              translateY:
                translateY.value,
            },
          ],
        };
      }

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
          translateY.value =
            withSequence(
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
      }, [
        animationType,
        playHaptic,
        scale,
        translateY,
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
        label={label}
        size={size}
        icon={
          <AnimatedIcon
            Icon={Icon}
            animatedStyle={animatedStyle}
            color={resolvedIconColor}
            fill={resolvedIconColor}
          />
        }
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