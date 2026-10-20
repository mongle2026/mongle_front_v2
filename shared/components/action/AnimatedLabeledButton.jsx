import React, { forwardRef, useCallback, useImperativeHandle, } from 'react';

import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming, } from 'react-native-reanimated';

import * as Haptics from 'expo-haptics';

import { colors } from '../../styles/color';
import LabeledButton from './LabeledButton';

export const ANIMATION_TYPE = Object.freeze({
  LIKE: 'LIKE',
  BOOKMARK: 'BOOKMARK',
  // 댓글: 켜고 끄는 상태가 없어서 말풍선이 살짝 눌렸다가 갸웃하며 튀어 오른다
  COMMENT: 'COMMENT',
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
    },
    ref,
  ) {
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);
    const rotate = useSharedValue(0);

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

      if (
        animationType ===
        ANIMATION_TYPE.COMMENT
      ) {
        return {
          transform: [
            { scale: scale.value },
            { rotate: `${rotate.value}deg` },
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

        if (
          animationType ===
          ANIMATION_TYPE.COMMENT
        ) {
          scale.value = withSequence(
            withTiming(0.88, {
              duration: 80,
              easing: Easing.out(Easing.quad),
            }),
            withSpring(1, {
              damping: 9,
              stiffness: 260,
            }),
          );
          rotate.value = withSequence(
            withTiming(-10, {
              duration: 110,
              easing: Easing.out(Easing.quad),
            }),
            withSpring(0, {
              damping: 8,
              stiffness: 200,
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
        rotate,
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