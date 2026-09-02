import React, { memo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../../shared/styles/color';
import { padding, radius } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';

const ICON_SIZE = 14;

const LabeledButton = ({
  icon,
  label,
  color = colors.fgNeutralMuted,
  iconColor = colors.fgNeutralMuted,
  backgroundColor = colors.bgNeutralFaint,
  typography = typo.suitLabelLargeStrong,
  onPress,
  disabled = false,
  style,
}) => {
  const renderedIcon = React.isValidElement(icon)
    ? React.cloneElement(icon, {
      width: ICON_SIZE,
      height: ICON_SIZE,
      color: iconColor,
      fill: iconColor,
    })
    : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.container, { backgroundColor }, style]}
    >
      {renderedIcon && (
        <View style={styles.icon}>
          {renderedIcon}
        </View>
      )}

      <Text
        allowFontScaling={false}
        style={[typography, { color }]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',

    paddingVertical: padding.S,
    paddingHorizontal: padding.M,
    gap: padding.S,

    borderRadius: radius.XS,
  },

  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    aspectRatio: 1,

    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default memo(LabeledButton);