import { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../../../styles/color';
import { padding, radius } from '../../../styles/token';
import { typo } from '../../../styles/typo';

const Items = ({
  label,
  isActive = false,
  onPress,
  accessibilityLabel = label,
  style,
}) => {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: isActive }}
      style={[styles.wrapper, style]}
    >
      <Text
        numberOfLines={1}
        style={[styles.item, isActive ? styles.itemActive : styles.itemInactive]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
    padding: padding.XXS,
    justifyContent: 'center',
    alignItems: 'center',
  },

  item: {
    paddingVertical: padding.XS,
    paddingHorizontal: padding.M,
    textAlign: 'center',
    borderRadius: radius.S,
    overflow: 'hidden',
    ...typo.suitLabelLarge,
  },

  itemInactive: {
    color: colors.fgNeutralSolid,
  },

  itemActive: {
    backgroundColor: colors.bgNeutralSolid,
    color: colors.fgNeutralInverted,
  },
});

export default memo(Items);
