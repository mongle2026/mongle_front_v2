import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../../styles/color';
import { padding, radius } from '../../styles/token';
import { typo } from '../../styles/typo';

const DEFAULT_TYPOGRAPHY = typo.kyoboLabelLarge;

const variantStyles = {
  Solid: {
    container: {
      backgroundColor: colors.bgBrandSolid,
      borderColor: colors.bgBrandSolid,
    },
    text: {
      color: colors.fgNeutralInverted,
    },
  },

  Ghost: {
    container: {
      backgroundColor: 'transparent',
      borderColor: colors.strokeBrandSolid,
    },
    text: {
      color: colors.fgBrand,
    },
  },
};

export const TextButton = ({
  children,
  variant = 'Solid',
  typography = DEFAULT_TYPOGRAPHY,
  disabled = false,
  showDisabledStyle = true,
  onPress,
  style,
  textStyle,
  ...props
}) => {
  const currentVariant =
    variantStyles[variant] ?? variantStyles.Solid;

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
        numberOfLines={1}
        style={[
          typography,
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
    width: '100%',
    padding: padding.S,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.XS,
  },

  disabled: {
    opacity: 0.4,
  },
});