import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View, } from 'react-native';

import { colors } from '../../styles/color';
import { gap, padding, radius } from '../../styles/token';
import { typo } from '../../styles/typo';

const SIZE_CONFIG = {
  S: {
    iconSize: 12,
    containerStyle: {
      paddingVertical: padding.S,
      paddingHorizontal: 0,
    },
  },

  M: {
    iconSize: 18,
    containerStyle: {
      padding: padding.M,
    },
  },
};

const TYPOGRAPHY_CONFIG = {
  kyobo: {
    S: typo.kyoboLabelSmall,
    M: typo.kyoboLabelLarge,
  },

  suit: {
    S: typo.suitLabelMedium,
    M: typo.suitLabelLarge,
  },
};

const LabeledButton = ({
  label,
  icon,
  size = 'M',
  font = 'kyobo',
  color = colors.fgNeutralSubtlest,
  disabled = false,
  onPress,
  style,
  textStyle,
  accessibilityLabel = label,
  ...pressableProps
}) => {
  const currentSize = SIZE_CONFIG[size] ?? SIZE_CONFIG.M;
  const currentFont = TYPOGRAPHY_CONFIG[font]
    ?? TYPOGRAPHY_CONFIG.kyobo;

  const typographyStyle = currentFont[size]
    ?? currentFont.M;

  const renderedIcon = React.isValidElement(icon)
    ? React.cloneElement(icon, {
        width: currentSize.iconSize,
        height: currentSize.iconSize,
        size: currentSize.iconSize,
        color: icon.props.color ?? color,
      })
    : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={[
        styles.container,
        currentSize.containerStyle,
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

      <Text
        style={[
          typographyStyle,
          styles.label,
          { color },
          textStyle,
        ]}
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
    alignItems: 'center',
    gap: gap.S,
    borderRadius: radius.XS,
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