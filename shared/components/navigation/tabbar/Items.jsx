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
    // 활성 탭의 검은 밑줄은 TabBar 가 이 줄 위에 겹쳐 그리고, 탭을 바꿀 때 옆으로 움직인다
    borderBottomWidth: 1,
    borderBottomColor: colors.strokeNeutralTertiary,
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
    color: colors.fgNeutralQuaternary,
  },

  labelActive: {
    ...typo.suitLabelLargeStrong,
    color: colors.fgNeutralPrimary,
  },
});

export default memo(Items);
