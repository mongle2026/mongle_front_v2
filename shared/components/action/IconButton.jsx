import React, { memo, cloneElement, isValidElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { padding, radius } from '../../styles/token';

const IconButton = ({
  icon,
  size = 'S',
  onPress,
  disabled = false,
  accessibilityLabel,
  style,
}) => {
  const currentSize = SIZE_STYLES[size] ?? SIZE_STYLES.S;

  const renderedIcon = isValidElement(icon)
    ? cloneElement(icon, {
      width: currentSize.iconSize,
      height: currentSize.iconSize,
    })
    : icon;

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