import React, { memo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../styles/color';
import { gap, padding, radius } from '../../styles/token';
import { typo } from '../../styles/typo';

const SIZE_CONFIG = {
  S: {
    iconSize: 12,
    typography: typo.suitLabelMedium,
    containerStyle: {
      paddingVertical: padding.XS,
      paddingHorizontal: 0,
    },
  },

  M: {
    iconSize: 18,
    typography: typo.suitLabelLarge,
    containerStyle: {
      padding: padding.M,
    },
  },
};

const LabeledButton = ({
  label,
  icon,
  size = 'M',

  color = colors.fgNeutralSubtlest,
  iconColor = colors.fgNeutralSubtlest,

  disabled = false,
  onPress,
  style,
  textStyle,
  accessibilityLabel,
  ...pressableProps
}) => {
  const currentSize =
    SIZE_CONFIG[size] ??
    SIZE_CONFIG.M;

  /*
   * 0은 유효한 label일 수 있으므로
   * 단순 Boolean(label)로 검사하지 않습니다.
   */
  const hasLabel =
    label !== undefined &&
    label !== null &&
    label !== '';

  const renderedIcon = React.isValidElement(icon)
    ? React.cloneElement(icon, {
        width: currentSize.iconSize,
        height: currentSize.iconSize,
        size: currentSize.iconSize,
        fill: iconColor,
        color: iconColor,
      })
    : null;

  const resolvedAccessibilityLabel =
    accessibilityLabel ??
    (hasLabel ? String(label) : undefined);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={resolvedAccessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={[
        styles.container,
        currentSize.containerStyle,
        hasLabel && styles.withLabel,
        disabled && styles.disabled,
        style,
      ]}
      {...pressableProps}
    >
      {renderedIcon && (
        <View
          style={[
            styles.iconContainer,
            {
              width: currentSize.iconSize,
              height: currentSize.iconSize,
            },
          ]}
        >
          {renderedIcon}
        </View>
      )}

      {hasLabel && (
        <Text
          style={[
            currentSize.typography,
            styles.label,
            { color },
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.XS,
  },

  /*
   * 아이콘만 사용하는 경우에는 gap을 적용하지 않습니다.
   */
  withLabel: {
    gap: gap.S,
  },

  iconContainer: {
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  label: {
    textAlign: 'justify',
  },

  disabled: {
    opacity: 0.4,
  },
});

export default memo(LabeledButton);