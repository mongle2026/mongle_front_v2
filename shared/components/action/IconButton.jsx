import React, { memo, isValidElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { padding, radius } from '../../styles/token';

const IconButton = ({
  icon: Icon,
  color,
  size = 'S',
  onPress,
  disabled = false,
  accessibilityLabel,
  style,
}) => {
  const currentSize = SIZE_STYLES[size] ?? SIZE_STYLES.S;

  // Icon은 보통 SVG 컴포넌트 참조를 받아 size/color를 직접 주입합니다.
  // 이미 완성된 엘리먼트(예: 아이콘이 아닌 커스텀 콘텐츠)가 오면 그대로 렌더링합니다.
  const renderedIcon = isValidElement(Icon)
    ? Icon
    : Icon
      ? (
        <Icon
          width={currentSize.iconSize}
          height={currentSize.iconSize}
          color={color}
          fill={color}
        />
      )
      : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={currentSize.hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.container,
        currentSize.container,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.icon,
          {
            width: currentSize.iconSize,
            height: currentSize.iconSize,
          },
        ]}
      >
        {renderedIcon}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.XS,
    flexShrink: 0,
  },

  sizeS: {
    padding: padding.XS,
  },

  sizeM: {
    padding: padding.M,
  },

  sizeL: {
    padding: padding.L,
  },

  sizeXL: {
    padding: padding.M,
  },

  icon: {
    aspectRatio: 1,
    flexShrink: 0,
  },

  pressed: {
    opacity: 0.6,
  },

  disabled: {
    opacity: 0.4,
  },
});

const SIZE_STYLES = {
  S: {
    container: styles.sizeS,
    iconSize: 14,
    hitSlop: 11,
  },

  M: {
    container: styles.sizeM,
    iconSize: 18,
    hitSlop: 5,
  },

  L: {
    container: styles.sizeL,
    iconSize: 20,
    hitSlop: 0,
  },

  XL: {
    container: styles.sizeXL,
    iconSize: 22,
    hitSlop: 3,
  },
};

export default memo(IconButton);