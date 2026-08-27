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
  onPress,
  disabled = false,
  style,
}) => {
  const renderedIcon = React.isValidElement(icon)
    ? React.cloneElement(icon, {
      width: ICON_SIZE,
      height: ICON_SIZE,
      color: colors.fgNeutralMuted,
      fill: colors.fgNeutralMuted,
    })
    : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.container, style]}
    >
      {renderedIcon && (
        <View style={styles.icon}>
          {renderedIcon}
        </View>
      )}

      <Text
        allowFontScaling={false}
        style={styles.label}
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
    backgroundColor: colors.bgNeutralFaint,
  },

  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    aspectRatio: 1,

    justifyContent: 'center',
    alignItems: 'center',
  },

  label: {
    ...typo.suitLabelLargeStrong,
    color: colors.fgNeutralMuted,
  },
});

export default memo(LabeledButton);