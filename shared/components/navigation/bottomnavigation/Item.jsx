import React, { memo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import { colors } from '../../../styles/color';
import { gap, padding } from '../../../styles/token';
import { typo } from '../../../styles/typo';

const ICON_SIZE = 24;

const Item = ({
  label,
  Icon,
  isActive = false,
  onPress,
  accessibilityLabel = label,
  style,
}) => {
  const contentColor = isActive
    ? colors.fgNeutralMuted
    : colors.fgNeutralWeak;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: isActive }}
      style={({ pressed }) => [
        styles.container,
        style,
        pressed && styles.pressed,
      ]}
    >
      <Icon
        width={ICON_SIZE}
        height={ICON_SIZE}
        color={contentColor}
      />

      <Text
        numberOfLines={1}
        style={[
          styles.label,
          { color: contentColor },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: padding.M,
    paddingBottom: padding.XXL,
    flexDirection: 'column',
    alignItems: 'center',
    gap: gap.S,
    backgroundColor: colors.bgLayerDefault,
  },

  pressed: {
    backgroundColor: colors.bgLayerDefaultPressed,
  },

  label: {
    alignSelf: 'stretch',
    textAlign: 'center',
    ...typo.suitCaptionLarge,
  },
});

export default memo(Item);