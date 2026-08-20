import { memo } from 'react';
import { Pressable, StyleSheet, Text, } from 'react-native';

import { colors } from '../../../styles/color';
import { padding, radius } from '../../../styles/token';
import { typo } from '../../../styles/typo';

const Item = ({
  label,
  isActive = false,
  onPress,
  accessibilityLabel,
  style,
}) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? String(label)}
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      style={[styles.container, style]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          isActive ? styles.activeLabel : styles.inactiveLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 42,
    height: 36,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.XS,
    backgroundColor: colors.bgLayerBasement,
  },

  label: {
    ...typo.suitTitleXLargeStrong,
    textAlign: 'center',
  },

  activeLabel: {
    color: colors.fgBrand,
  },

  inactiveLabel: {
    color: colors.fgNeutralSubtlest,
  },
});

export default memo(Item);