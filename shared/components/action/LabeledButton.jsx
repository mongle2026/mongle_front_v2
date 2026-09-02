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
    iconSize: 22,
    typography: typo.suitLabelLarge,
    containerStyle: {
      padding: padding.M,
    },
  },
};

const LabeledButton = ({
  label,
  icon: Icon,
  renderIcon,
  size = 'M',

  color = colors.fgNeutralWeak,
  iconColor = colors.fgNeutralWeak,

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

  const hasLabel =
    label !== undefined &&
    label !== null &&
    label !== '';

  // icon은 SVG 컴포넌트 참조를 받아 size/iconColor를 직접 주입합니다.
  // 애니메이션 등 아이콘을 감싸는 마크업이 필요하면 renderIcon을 사용합니다.
  const renderedIcon = renderIcon
    ? renderIcon({ size: currentSize.iconSize, color: iconColor })
    : Icon
      ? (
        <Icon
          width={currentSize.iconSize}
          height={currentSize.iconSize}
          fill={iconColor}
          color={iconColor}
        />
      )
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