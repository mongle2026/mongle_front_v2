import { memo, useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import FontFallbackText from '../../atomic/FontFallbackText';

import { colors } from '../../../styles/color';
import { padding, radius } from '../../../styles/token';
import { typo } from '../../../styles/typo';
import { FONT, normalizeFont } from '../../../styles/fontType';

export const USERNAME_TAG_VARIANT = Object.freeze({
  GHOST: 'Ghost',
  SOLID: 'Solid',
});

const { GHOST, SOLID } = USERNAME_TAG_VARIANT;

const TAG_HEIGHT = 24;
const BORDER_WIDTH = 1;

// 팔로우 버튼의 variant 전환과 같은 시간으로 맞춘다
const VARIANT_TRANSITION_TIMING = { duration: 380, easing: Easing.inOut(Easing.cubic) };

const VARIANT_STYLES = {
  [GHOST]: {
    container: {
      backgroundColor: 'transparent',
      borderColor: colors.strokeNeutralPrimary,
    },

    text: {
      color: colors.fgNeutralPrimary,
    },
  },

  [SOLID]: {
    container: {
      backgroundColor: colors.fillNeutralStrong,
      borderColor: colors.fillNeutralStrong,
    },

    text: {
      color: colors.fgNeutralInverted,
    },
  },
};

const resolveVariant = variant => (VARIANT_STYLES[variant] ? variant : GHOST);

/* 직전 variant 모습. 처음 그려질 때 완전히 보였다가 서서히 사라진다 */
const VariantFadeOutLayer = ({ id, variant, typographyStyle, textStyle, onEnd, children }) => {
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
        VARIANT_STYLES[variant].container,
        // 투명 배경이었다면 화면 배경색을 깔아, 새 배경이 순간 드러나지 않고 서서히 비치게 한다
        variant === GHOST && styles.transitionBackdrop,
        animatedStyle,
      ]}
    >
      <FontFallbackText
        numberOfLines={1}
        style={[typographyStyle, VARIANT_STYLES[variant].text, textStyle]}
      >
        {children}
      </FontFallbackText>
    </Animated.View>
  );
};

// 피드 Profile 의 @아이디 태그. 폰트와 상관없이 높이가 프로필 이미지 S(24)와 같다
const UsernameTag = ({
  children,
  variant = GHOST,
  font = FONT.KYOBO,
  onPress,
  accessibilityLabel,
  style,
  textStyle,
}) => {
  const currentVariant = resolveVariant(variant);
  const variantStyle = VARIANT_STYLES[currentVariant];

  const typographyStyle = normalizeFont(font) === FONT.SUIT
    ? typo.suitBodyMedium400
    : typo.kyoboBodyMedium;

  const [renderedVariant, setRenderedVariant] = useState(currentVariant);
  const [transition, setTransition] = useState(null);

  // 바뀐 것을 렌더 중에 알아채 같은 커밋에 덮개를 붙인다 (Button 과 같은 방식)
  if (renderedVariant !== currentVariant) {
    setTransition({ id: (transition?.id ?? 0) + 1, from: renderedVariant });
    setRenderedVariant(currentVariant);
  }

  const handleTransitionEnd = useCallback(id => {
    setTransition(current => (current?.id === id ? null : current));
  }, []);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        variantStyle.container,
        pressed && currentVariant === SOLID && styles.solidPressed,
        style,
      ]}
    >
      <FontFallbackText
        numberOfLines={1}
        style={[typographyStyle, variantStyle.text, textStyle]}
      >
        {children}
      </FontFallbackText>

      {transition && (
        <VariantFadeOutLayer
          key={transition.id}
          id={transition.id}
          variant={transition.from}
          typographyStyle={typographyStyle}
          textStyle={textStyle}
          onEnd={handleTransitionEnd}
        >
          {children}
        </VariantFadeOutLayer>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',

    // height 로 고정하면 시스템 글자 크기를 키웠을 때 글자가 잘린다
    minHeight: TAG_HEIGHT,
    paddingHorizontal: padding.S - BORDER_WIDTH,

    borderWidth: BORDER_WIDTH,
    borderRadius: radius.XS,
    overflow: 'hidden',
  },

  solidPressed: {
    backgroundColor: colors.fillNeutralStrongPress,
  },

  // 태그 전체를 덮는 직전 모습. 테두리 바깥까지 덮는다
  transitionLayer: {
    position: 'absolute',
    top: -BORDER_WIDTH,
    right: -BORDER_WIDTH,
    bottom: -BORDER_WIDTH,
    left: -BORDER_WIDTH,

    justifyContent: 'center',
    alignItems: 'center',

    borderWidth: BORDER_WIDTH,
    borderRadius: radius.XS,
  },

  transitionBackdrop: {
    backgroundColor: colors.bgSurface,
  },
});

export default memo(UsernameTag);
