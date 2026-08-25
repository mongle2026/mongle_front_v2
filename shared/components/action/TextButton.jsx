import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../../styles/color';
import { padding, radius } from '../../styles/token';
import { typo } from '../../styles/typo';
import { FONT, normalizeFont } from '../../styles/font';

export const TEXT_BUTTON_VARIANT = Object.freeze({
  SOLID: 'Solid',
  GHOST: 'Ghost',
  NEUTRAL_WEAK: 'NeutralWeak',
  CRITICAL: 'Critical',
  BG_INFO_WEAK: 'BgInfoWeak',
  DISABLED: 'Disabled',
});

export const TEXT_BUTTON_SIZE = Object.freeze({
  S: 'S',
  M: 'M',
  L: 'L',
  XL: 'XL',
});

const {
  SOLID,
  GHOST,
  NEUTRAL_WEAK,
  CRITICAL,
  BG_INFO_WEAK,
  DISABLED,
} = TEXT_BUTTON_VARIANT;

const { S, M, L, XL } = TEXT_BUTTON_SIZE;

/**
 * Variant별 허용 사이즈
 *
 * Solid       S / L / XL
 * Ghost       S
 * NeutralWeak M / L
 * Critical    L
 * BgInfoWeak  M
 * Disabled    L / XL
 */
const ALLOWED_SIZES = {
  [SOLID]: [S, L, XL],
  [GHOST]: [S],
  [NEUTRAL_WEAK]: [M, L],
  [CRITICAL]: [L],
  [BG_INFO_WEAK]: [M],
  [DISABLED]: [L, XL],
};

/**
 * size를 지정하지 않았거나
 * 허용되지 않는 사이즈를 넣었을 때 사용할 기본값
 */
const DEFAULT_SIZE = {
  [SOLID]: S,
  [GHOST]: S,
  [NEUTRAL_WEAK]: M,
  [CRITICAL]: L,
  [BG_INFO_WEAK]: M,
  [DISABLED]: L,
};

/**
 * 버튼 크기
 *
 * inline-flex는 React Native에 없으므로
 * alignSelf: 'flex-start'로 content width를 사용합니다.
 */
const SIZE_STYLES = {
  [S]: {
    paddingVertical: padding.XXS,
    paddingHorizontal: padding.XS,
    borderRadius: radius.XS,
  },

  [M]: {
    paddingVertical: padding.M,
    paddingHorizontal: padding.L,
    borderRadius: radius.M,
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

/**
 * Font + Size typography
 *
 * 모든 버튼의 기본 font는 Kyobo.
 *
 * S
 * Kyobo = kyoboLabelLarge
 * SUIT  = suitLabelLarge
 *
 * M / L / XL
 * Kyobo = kyoboLabelXLarge
 * SUIT  = suitLabelXLargeStrong
 *
 * Kyobo는 단일 weight 폰트라 Strong을 별도로 두지 않습니다.
 */
const TYPOGRAPHY_STYLES = {
  [S]: {
    [FONT.KYOBO]: typo.kyoboLabelLarge,
    [FONT.SUIT]: typo.suitLabelLarge,
  },

  [M]: {
    [FONT.KYOBO]: typo.kyoboLabelXLarge,
    [FONT.SUIT]: typo.suitLabelXLargeStrong,
  },

  [L]: {
    [FONT.KYOBO]: typo.kyoboLabelXLarge,
    [FONT.SUIT]: typo.suitLabelXLargeStrong,
  },

  [XL]: {
    [FONT.KYOBO]: typo.kyoboLabelXLarge,
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
      backgroundColor: colors.bgNeutralSolid,
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
      borderColor: colors.strokeNeutralSolid,
    },

    text: {
      color: colors.fgNeutralSolid,
    },
  },

  [NEUTRAL_WEAK]: {
    container: {
      backgroundColor: colors.bgNeutralFaint,
      borderWidth: 0,
    },

    text: {},

    textBySize: {
      [M]: {
        color: colors.fgNeutralSubtle,
      },

      [L]: {
        color: colors.fgNeutralSolid,
      },
    },
  },

  [CRITICAL]: {
    container: {
      backgroundColor: colors.bgCriticalSolid,
      borderWidth: 0,
    },

    text: {
      color: colors.fgNeutralInverted,
    },
  },

  [BG_INFO_WEAK]: {
    container: {
      backgroundColor: colors.bgInfoWeak,
      borderWidth: 0,
    },

    text: {
      color: colors.fgInformativeContrast,
    },
  },

  [DISABLED]: {
    container: {
      backgroundColor: colors.bgNeutralFaint,
      borderWidth: 0,
    },

    text: {
      color: colors.fgDisabled,
    },
  },
};

const resolveVariant = variant => {
  if (VARIANT_STYLES[variant]) {
    return variant;
  }

  return SOLID;
};

const resolveSize = (variant, size) => {
  const allowedSizes = ALLOWED_SIZES[variant];

  if (size && allowedSizes?.includes(size)) {
    return size;
  }

  return DEFAULT_SIZE[variant];
};

export const TextButton = ({
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
  const currentSize = resolveSize(currentVariant, size);
  const currentFont = normalizeFont(font);

  const variantStyle = VARIANT_STYLES[currentVariant];
  const sizeStyle = SIZE_STYLES[currentSize];

  const typographyStyle =
    TYPOGRAPHY_STYLES[currentSize]?.[currentFont] ??
    TYPOGRAPHY_STYLES[currentSize]?.[FONT.KYOBO];

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
        typeof style === 'function'
          ? style(state)
          : style,
      ]}
    >
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={[
          typographyStyle,
          variantStyle.text,
          variantStyle.textBySize?.[currentSize],
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

    justifyContent: 'center',
    alignItems: 'center',
  },
});