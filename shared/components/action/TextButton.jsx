import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../../styles/color';
import { padding, radius } from '../../styles/token';
import { typo } from '../../styles/typo';

const TYPOGRAPHY_CONFIG = {
  kyobo: typo.kyoboLabelLarge,
  suit: typo.suitLabelLarge,
};

const VARIANT_STYLES = {
  Solid: {
    container: {
      backgroundColor: colors.bgBrandSolid,
      borderWidth: 0,
    },
    text: {
      color: colors.fgNeutralInverted,
    },
  },

  Ghost: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.strokeBrandSolid,
    },
    text: {
      color: colors.fgBrand,
    },
  },

  Critical: {
    container: {
      paddingVertical: padding.L,
      paddingHorizontal: padding.XL,

      borderRadius: radius.M,
      backgroundColor: colors.bgCriticalSolid,
      borderWidth: 0,
    },
    text: {
      ...typo.suitLabelXLargeStrong,
      color: colors.fgNeutralInverted,
    },
  },

  BrandWeak: {
    container: {
      paddingVertical: padding.L,
      paddingHorizontal: padding.XL,

      borderRadius: radius.M,
      backgroundColor: colors.bgBrandWeak,
      borderWidth: 0,
    },
    text: {
      ...typo.suitLabelXLargeStrong,
      color: colors.fgBrand,
    },
  },
};

export const TextButton = ({
  children,
  variant = 'Solid',
  font = 'kyobo',
  disabled = false,
  showDisabledStyle = true,
  onPress,
  style,
  textStyle,
  ...props
}) => {
  const currentVariant =
    VARIANT_STYLES[variant] ?? VARIANT_STYLES.Solid;

  const isLargeButton =
    variant === 'Critical' ||
    variant === 'BrandWeak';

  const currentTypography = isLargeButton
    ? null
    : TYPOGRAPHY_CONFIG[font] ?? TYPOGRAPHY_CONFIG.kyobo;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.container,
        currentVariant.container,
        disabled && showDisabledStyle && styles.disabled,
        style,
      ]}
      {...props}
    >
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={[
          currentTypography,
          currentVariant.text,
          textStyle,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',

    paddingVertical: padding.XXS,
    paddingHorizontal: padding.XS,

    justifyContent: 'center',
    alignItems: 'center',

    borderRadius: radius.XS,
  },

  disabled: {
    opacity: 0.4,
  },
});