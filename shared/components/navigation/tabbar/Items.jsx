import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../styles/color';
import { gap, padding } from '../../../styles/token';
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
      style={[
        styles.container,
        isActive ? styles.containerActive : styles.containerInactive,
        style,
      ]}
    >
      <View style={styles.inner}>
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            isActive ? styles.labelActive : styles.labelInactive,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: padding.L,
    paddingHorizontal: padding.M,
    justifyContent: 'center',
    alignItems: 'center',
  },

  containerInactive: {
    borderBottomWidth: 1,
    borderBottomColor: colors.strokeNeutralWeak,
  },

  containerActive: {
    borderBottomWidth: 1.5,
    borderBottomColor: colors.strokeNeutralSolid,
  },

  inner: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap.M,
  },

  label: {
    textAlign: 'center',
  },

  labelInactive: {
    ...typo.suitLabelLarge,
    color: colors.fgNeutralWeak,
  },

  labelActive: {
    ...typo.suitLabelLargeStrong,
    color: colors.fgNeutralSolid,
  },
});

export default memo(Items);
