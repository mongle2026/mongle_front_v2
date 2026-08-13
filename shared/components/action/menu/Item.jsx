import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../styles/color';
import { gap, padding } from '../../../styles/token';
import { typo } from '../../../styles/typo';

const ICON_SIZE = 16;

const Item = ({
  icon: Icon,
  label,
  color = colors.fgNeutralMuted,
  onPress,
  disabled = false,
  iconProps,
  style,
  textStyle,
  accessibilityLabel = label,
}) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {Icon && (
        <View style={styles.iconContainer}>
          <Icon
            width={ICON_SIZE}
            height={ICON_SIZE}
            color={color}
            fill={color}
            {...iconProps}
          />
        </View>
      )}
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          { color },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    paddingVertical: padding.XL,
    paddingHorizontal: padding.XXL,
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap.M,
    backgroundColor: colors.bgLayerDefault,
  },
  pressed: {
    backgroundColor: colors.bgLayerDefaultPressed,
  },
  disabled: {
    backgroundColor: colors.bgDisabled,
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