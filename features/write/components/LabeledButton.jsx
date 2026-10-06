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
  color = colors.fgNeutralSecondary,
  iconColor = colors.fgNeutralSecondary,
  backgroundColor = colors.fillNeutralWeak,
  pressedBackgroundColor = colors.fillNeutralWeakPress,
  typography = typo.suitLabelLargeStrong,
  onPress,
  disabled = false,
  style,
}) => {
  const resolvedColor = disabled ? colors.fgDisabled : color;
  const resolvedIconColor = disabled ? colors.fgDisabled : iconColor;

  const renderedIcon = React.isValidElement(icon)
    ? React.cloneElement(icon, {
      width: ICON_SIZE,
      height: ICON_SIZE,
      color: resolvedIconColor,
      fill: resolvedIconColor,
    })
    : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: pressed ? pressedBackgroundColor : backgroundColor },
        style,
      ]}
    >
      {renderedIcon && (
        <View style={styles.icon}>
          {renderedIcon}
        </View>
      )}

      <Text
        style={[typography, { color: resolvedColor }]}
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