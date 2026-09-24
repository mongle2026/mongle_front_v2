import React, { memo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import Animated from 'react-native-reanimated';

import usePressAnimation from '../../../hooks/usePressAnimation';
import { colors } from '../../../styles/color';
import { gap, padding } from '../../../styles/token';
import { typo } from '../../../styles/typo';

const ICON_SIZE = 24;

const Item = ({
  label,
  icon: Icon,
  isActive = false,
  onPress,
  accessibilityLabel = label,
  style,
}) => {
  const contentColor = isActive
    ? colors.fgNeutralMuted
    : colors.fgDisabled;

  const { animatedStyle, pressHandlers } = usePressAnimation({ onPress });

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Pressable
        accessibilityRole="tab"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected: isActive }}
        {...pressHandlers}
        style={styles.container}
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
    </Animated.View>
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

  label: {
    alignSelf: 'stretch',
    textAlign: 'center',
    ...typo.suitCaptionLarge,
  },
});

export default memo(Item);