import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

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

// variant 가 바뀔 때(예: 팔로우 Solid → 팔로잉 Ghost) 이전 모습이 이 시간 동안 흐려지며 새 모습으로 넘어간다
const VARIANT_TRANSITION_TIMING = { duration: 380, easing: Easing.inOut(Easing.cubic) };

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

  // variant 가 바뀌는 순간 투명 배경(Ghost) 쪽 모습을 그릴 때 깔 색. 버튼이 놓인 화면 배경색과 같게 둔다
  transitionBackdropColor = colors.bgSurface,

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

  /*
   * variant 전환 크로스페이드.
   * 새 variant 는 바로 그리고, 그 위에 직전 모습(배경 · 테두리 · 글자)을 한 겹 덮어 두었다가 흐리게 걷어낸다.
   * 글자도 바뀌는 경우(팔로우 → 팔로잉)가 있어서 직전 children 도 같이 기억한다.
   *
   * 바뀐 것을 렌더 중에 알아채 같은 커밋에 덮개를 붙인다.
   * (effect 에서 붙이면 새 모습이 한 프레임 먼저 보여 전환이 아니라 깜빡임처럼 보인다)
   */
  const [renderedVariant, setRenderedVariant] = useState(currentVariant);
  const [transition, setTransition] = useState(null);
  // 마지막으로 화면에 그려진 글자 (variant 가 바뀌는 순간의 '직전 글자')
  const committedChildrenRef = useRef(children);

  if (renderedVariant !== currentVariant) {
    setTransition({
      id: (transition?.id ?? 0) + 1,
      from: { variant: renderedVariant, children: committedChildrenRef.current },
    });
    setRenderedVariant(currentVariant);
  }

  useEffect(() => {
    committedChildrenRef.current = children;
  });

  const handleTransitionEnd = useCallback(id => {
    setTransition(current => (current?.id === id ? null : current));
  }, []);

  // 테두리가 있는 variant(Ghost)도 Figma 처럼 테두리를 안쪽에 그려, 다른 variant 와 크기를 같게 맞춘다
  const borderWidth = variantStyle.container.borderWidth ?? 0;
  const sizeWithBorderStyle = borderWidth > 0
    ? {
      ...sizeStyle,
      paddingVertical: sizeStyle.paddingVertical - borderWidth,
      paddingHorizontal: sizeStyle.paddingHorizontal - borderWidth,
    }
    : sizeStyle;

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
        sizeWithBorderStyle,
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

      {transition && (
        <VariantFadeOutLayer
          key={transition.id}
          id={transition.id}
          fromVariantStyle={VARIANT_STYLES[transition.from.variant]}
          borderRadius={sizeStyle.borderRadius}
          // 덮개는 새 variant 의 테두리 바깥까지 버튼 전체를 덮는다
          inset={-borderWidth}
          backdropColor={transitionBackdropColor}
          typographyStyle={typographyStyle}
          textStyle={textStyle}
          onEnd={handleTransitionEnd}
        >
          {transition.from.children}
        </VariantFadeOutLayer>
      )}
    </Pressable>
  );
};

/* 직전 variant 모습. 처음 그려질 때 완전히 보였다가 서서히 사라진다 */
const VariantFadeOutLayer = ({
  id,
  fromVariantStyle,
  borderRadius,
  inset,
  backdropColor,
  typographyStyle,
  textStyle,
  onEnd,
  children,
}) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(0, VARIANT_TRANSITION_TIMING, finished => {
      if (finished) scheduleOnRN(onEnd, id);
    });
  }, [id, onEnd, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.transitionLayer,
        { top: inset, right: inset, bottom: inset, left: inset, borderRadius },
        fromVariantStyle.container,
        // 투명 배경이었다면 화면 배경색을 깔아, 새 배경이 순간 드러나지 않고 서서히 비치게 한다
        fromVariantStyle.container.backgroundColor === 'transparent' && {
          backgroundColor: backdropColor,
        },
        animatedStyle,
      ]}
    >
      <FontFallbackText
        numberOfLines={1}
        style={[typographyStyle, fromVariantStyle.text, textStyle]}
      >
        {children}
      </FontFallbackText>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',

    justifyContent: 'center',
    alignItems: 'center',
  },

  // 버튼 전체를 덮는 직전 모습. 가운데 정렬이라 글자가 새 글자와 같은 자리에 겹친다
  transitionLayer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});