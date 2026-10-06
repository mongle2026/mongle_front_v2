import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { colors } from '../../styles/color';
import { padding, radius } from '../../styles/token';
import { typo } from '../../styles/typo';
import { FONT, normalizeFont } from '../../styles/fontType';
import FontFallbackText from '../atomic/FontFallbackText';

// Figma 컴포넌트: action/TextButton (type × size × font)
export const BUTTON_VARIANT = Object.freeze({
  SOLID: 'Solid',
  GHOST: 'Ghost',
  WEAK: 'Weak',
  CRITICAL: 'Critical',
  INFO_WEAK: 'InfoWeak',
  DISABLED: 'Disabled',
});

export const BUTTON_SIZE = Object.freeze({
  S: 'S',
  M: 'M',
  L: 'L',
  XL: 'XL',
});

const {
  SOLID,
  GHOST,
  WEAK,
  CRITICAL,
  INFO_WEAK,
  DISABLED,
} = BUTTON_VARIANT;

const { S, M, L, XL } = BUTTON_SIZE;

/**
 * 버튼 크기. 모든 variant가 S / M / L / XL 을 가진다.
 *
 * inline-flex는 React Native에 없으므로
 * alignSelf: 'flex-start'로 content width를 사용합니다.
 */
const SIZE_STYLES = {
  [S]: {
    paddingVertical: padding.XXS,
    paddingHorizontal: padding.S,
    borderRadius: radius.XS,
  },

  [M]: {
    paddingVertical: padding.M,
    paddingHorizontal: padding.L,
    borderRadius: radius.S,
  },

  [L]: {
    paddingVertical: padding.L,
    paddingHorizontal: padding.XL,
    borderRadius: radius.M,
  },

  [XL]: {
    paddingVertical: padding.XL,
    paddingHorizontal: padding.XXL,
    borderRadius: radius.M,
  },
};

const resolveSize = size => (SIZE_STYLES[size] ? size : S);

/**
 * Font + Size typography
 *
 * 교보는 S 사이즈의 Solid / Ghost 에만 있다. 나머지 조합은 font 와 상관없이 SUIT.
 *
 * S       Kyobo = kyoboLabelLarge / SUIT = suitLabelLarge
 * M       SUIT  = suitLabelLargeStrong
 * L/XL    SUIT  = suitLabelXLargeStrong
 */
const KYOBO_VARIANTS_BY_SIZE = {
  [S]: [SOLID, GHOST],
};

const resolveFont = (variant, size, font) =>
  KYOBO_VARIANTS_BY_SIZE[size]?.includes(variant)
    ? normalizeFont(font)
    : FONT.SUIT;

const TYPOGRAPHY_STYLES = {
  [S]: {
    [FONT.KYOBO]: typo.kyoboLabelLarge,
    [FONT.SUIT]: typo.suitLabelLarge,
  },

  [M]: {
    [FONT.SUIT]: typo.suitLabelLargeStrong,
  },

  [L]: {
    [FONT.SUIT]: typo.suitLabelXLargeStrong,
  },

  [XL]: {
    [FONT.SUIT]: typo.suitLabelXLargeStrong,
  },
};

/**
 * Variant는 색상 / stroke만 담당합니다.
 * padding, radius, typography는 size에서 담당합니다.
 */
const VARIANT_STYLES = {
  [SOLID]: {
    container: {
      backgroundColor: colors.fillNeutral,
      borderWidth: 0,
    },

    text: {
      color: colors.fgNeutralInverted,
    },
  },

  [GHOST]: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.strokeNeutralPrimary,
    },

    text: {
      color: colors.fgNeutralPrimary,
    },
  },

  [WEAK]: {
    container: {
      backgroundColor: colors.fillNeutralWeak,
      borderWidth: 0,
    },

    text: {
      color: colors.fgNeutralSecondary,
    },
  },

  [CRITICAL]: {
    container: {
      backgroundColor: colors.fillCritical,
      borderWidth: 0,
    },

    text: {
      color: colors.fgNeutralInverted,
    },
  },

  [INFO_WEAK]: {
    container: {
      backgroundColor: colors.fillInfoWeak,
      borderWidth: 0,
    },

    text: {
      color: colors.fgInfo,
    },
  },

  [DISABLED]: {
    container: {
      backgroundColor: colors.fillNeutralWeak,
      borderWidth: 0,
    },

    text: {
      color: colors.fgDisabled,
    },
  },
};

/**
 * 눌렀을 때 배경. 시스템 컬러의 *Press 토큰을 쓴다.
 * Ghost 는 press 배경이 없고, Disabled 는 눌리지 않는다.
 */
const PRESSED_CONTAINER_STYLES = {
  [SOLID]: { backgroundColor: colors.fillNeutralPress },
  [WEAK]: { backgroundColor: colors.fillNeutralWeakPress },
  [CRITICAL]: { backgroundColor: colors.fillCriticalPress },
  [INFO_WEAK]: { backgroundColor: colors.fillInfoWeakPress },
};

const resolveVariant = variant => {
  if (VARIANT_STYLES[variant]) {
    return variant;
  }

  return SOLID;
};

export const Button = ({
  children,

  variant = SOLID,
  size,
  font = FONT.KYOBO,

  disabled = false,

  onPress,

  style,
  textStyle,

  ...props
}) => {
  const currentVariant = resolveVariant(variant);
  const currentSize = resolveSize(size);
  const currentFont = resolveFont(currentVariant, currentSize, font);

  const variantStyle = VARIANT_STYLES[currentVariant];
  const sizeStyle = SIZE_STYLES[currentSize];

  const typographyStyle =
    TYPOGRAPHY_STYLES[currentSize][currentFont] ??
    TYPOGRAPHY_STYLES[currentSize][FONT.SUIT];

  /**
   * Disabled variant 자체가 터치 불가능해야 하고,
   * disabled prop을 직접 전달한 경우에도 터치 불가능합니다.
   */
  const isDisabled =
    disabled ||
    currentVariant === DISABLED;

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{
        ...props.accessibilityState,
        disabled: isDisabled,
      }}
      disabled={isDisabled}
      onPress={isDisabled ? undefined : onPress}
      style={state => [
        styles.container,
        sizeStyle,
        variantStyle.container,
        state.pressed && !isDisabled && PRESSED_CONTAINER_STYLES[currentVariant],
        typeof style === 'function'
          ? style(state)
          : style,
      ]}
    >
      <FontFallbackText
        numberOfLines={1}
        style={[
          typographyStyle,
          variantStyle.text,
          textStyle,
        ]}
      >
        {children}
      </FontFallbackText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',

    justifyContent: 'center',
    alignItems: 'center',
  },
});