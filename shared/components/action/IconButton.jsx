import React, { memo } from 'react';
import { Pressable, StyleSheet, View, } from 'react-native';

import { padding, radius } from '../../styles/token';

const SIZE_STYLES = {
  S: {
    container: styles.sizeS,
    hitSlop: 11,
  },
  M: {
    container: styles.sizeM,
    hitSlop: 5,
  },
};

const IconButton = ({
  icon,
  size = 'M',
  onPress,
  disabled = false,
  accessibilityLabel,
  style,
}) => {
  const currentSize = SIZE_STYLES[size] ?? SIZE_STYLES.M;

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
      <View pointerEvents="none">
        {icon}
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
    width: 22,
    height: 22,
    padding: padding.S,
  },

  sizeM: {
    width: 34,
    height: 34,
    padding: padding.M,
  },

  pressed: {
    opacity: 0.6,
  },

  disabled: {
    opacity: 0.4,
  },
});

export default memo(IconButton);