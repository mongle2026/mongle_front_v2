import { memo } from 'react';
import { Pressable, StyleSheet, Text, } from 'react-native';

import { colors } from '../../../styles/color';
import { padding, radius } from '../../../styles/token';
import { typo } from '../../../styles/typo';

// Figma 컴포넌트: navigation/TopNavigationItem (isActive)
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
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.XS,
  },

  label: {
    ...typo.suitTitleXLargeStrong,
    textAlign: 'center',
  },

  activeLabel: {
    color: colors.fgNeutralPrimary,
  },

  inactiveLabel: {
    color: colors.fgNeutralQuaternary,
  },
});

export default memo(Item);