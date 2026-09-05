import React, { memo, useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import ProfileBar from './ProfileBar';
import ActionBar from './ActionBar';

import MusicCard from '../../../../shared/components/content/MusicCard';
import { WriteImg } from '../../../../shared/components/atomic/WriteImg';
import SuitSafeText from '../../../../shared/components/atomic/SuitSafeText';
import { colors } from '../../../../shared/styles/color';
import { gap, padding, radius } from '../../../../shared/styles/token';
import { typo } from '../../../../shared/styles/typo';
import { FONT, normalizeFont } from '../../../../shared/styles/font';

const POST_FONT_STYLES = Object.freeze({
  [FONT.KYOBO]: typo.kyoboBodyLarge,
  [FONT.SUIT]: typo.suitBodyLarge,
});

const TEXT_LINES_WITH_IMAGES = 8;
const TEXT_LINES_WITHOUT_IMAGES = 13;

const PRESSED_SCALE = 0.99;
const PRESSED_TRANSLATE_Y = 1;
const PRESS_IN_DURATION = 90;
const PRESS_MOVE_THRESHOLD = 8;

const PRESS_OUT_SPRING_CONFIG = {
  damping: 18,
  stiffness: 260,
  mass: 0.5,
  overshootClamping: true,
};

const getImageKey = (imageSource, index) => {
  if (typeof imageSource === 'string') return `${imageSource}-${index}`;

  if (imageSource && typeof imageSource === 'object' && imageSource.uri) {
    return `${imageSource.uri}-${index}`;
  }

  return `post-image-${index}`;
};

const PostCard = ({
  profileProps,
  musicProps,
  actionProps,
  onPress,
  content,
  imageSources = [],
  font = FONT.KYOBO,
  style,
  contentAreaStyle,
  textContainerStyle,
  textStyle,
  imageContainerStyle,
  imageStyle,
}) => {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  // textViewport가 실제로 차지하는 높이를 측정해서, 남는 공간이 있으면
  // 고정 줄 수(TEXT_LINES_*)보다 더 많은 줄을 보여주기 위한 값
  const [textViewportHeight, setTextViewportHeight] = useState(0);

  const handleTextViewportLayout = useCallback(event => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    setTextViewportHeight(currentHeight => (currentHeight === nextHeight ? currentHeight : nextHeight));
  }, []);

  const pressStartRef = useRef(null);
  const didMoveRef = useRef(false);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: scale.value,
      },
      {
        translateY: translateY.value,
      },
    ],
  }));

  const handlePressIn = useCallback(event => {
    const { pageX, pageY } = event.nativeEvent;

    pressStartRef.current = {
      x: pageX,
      y: pageY,
    };

    didMoveRef.current = false;

    scale.value = withTiming(PRESSED_SCALE, {
      duration: PRESS_IN_DURATION,
    });

    translateY.value = withTiming(
      PRESSED_TRANSLATE_Y,
      {
        duration: PRESS_IN_DURATION,
      },
    );
  }, [scale, translateY]);

  const handlePressMove = useCallback(event => {
    const start = pressStartRef.current;

    if (!start || didMoveRef.current) return;

    const { pageX, pageY } = event.nativeEvent;

    const deltaX = pageX - start.x;
    const deltaY = pageY - start.y;

    const distance = Math.hypot(
      deltaX,
      deltaY,
    );

    if (distance >= PRESS_MOVE_THRESHOLD) {
      didMoveRef.current = true;
    }
  }, []);

  const handleCardPress = useCallback(event => {
    const didMove = didMoveRef.current;

    pressStartRef.current = null;
    didMoveRef.current = false;

    if (didMove) return;

    onPress?.(event);
  }, [onPress]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, PRESS_OUT_SPRING_CONFIG);
    translateY.value = withSpring(0, PRESS_OUT_SPRING_CONFIG);
  }, [scale, translateY]);

  const hasContent =
    typeof content === 'string' && content.trim().length > 0;

  const visibleImages = imageSources.filter(Boolean).slice(0, 2);
  const hasImages = visibleImages.length > 0;
  const hasTwoImages = visibleImages.length === 2;

  const normalizedFont = normalizeFont(font);

  const contentFontStyle =
    POST_FONT_STYLES[normalizedFont] ??
    POST_FONT_STYLES[FONT.KYOBO];

  const fallbackNumberOfLines = hasImages
    ? TEXT_LINES_WITH_IMAGES
    : TEXT_LINES_WITHOUT_IMAGES;

  // textViewport 높이가 측정되면 그 공간에 실제로 들어가는 줄 수를 계산해서
  // 여백이 남는 카드는 고정값보다 더 많은 텍스트를 보여준다.
  const lineHeight = contentFontStyle.lineHeight || 1;
  const measuredNumberOfLines = textViewportHeight > 0
    ? Math.floor(textViewportHeight / lineHeight)
    : 0;

  const textNumberOfLines = Math.max(fallbackNumberOfLines, measuredNumberOfLines);

  const isPressable = typeof onPress === 'function';

  return (
    <Animated.View
      style={[
        styles.card,
        style,
        animatedCardStyle,
      ]}
    >
      <Pressable
        onPress={handleCardPress}
        onPressIn={
          isPressable
            ? handlePressIn
            : undefined
        }
        onPressMove={
          isPressable
            ? handlePressMove
            : undefined
        }
        onPressOut={
          isPressable
            ? handlePressOut
            : undefined
        }
        style={styles.pressArea}
      >
        <ProfileBar
          {...profileProps}
          font={normalizedFont}
        />

        <MusicCard
          {...musicProps}
          font={normalizedFont}
        />

        <View style={[styles.contentArea, contentAreaStyle]}>
          <View style={[styles.textContainer, textContainerStyle]}>
            <View style={styles.textViewport} onLayout={handleTextViewportLayout}>
              {hasContent && (
                <SuitSafeText
                  numberOfLines={textNumberOfLines}
                  ellipsizeMode="tail"
                  style={[
                    styles.contentText,
                    contentFontStyle,
                    textStyle,
                  ]}
                >
                  {content}
                </SuitSafeText>
              )}
            </View>
          </View>

          {hasImages && (
            <View style={[styles.imageContainer, imageContainerStyle]}>
              {visibleImages.map((imageSource, index) => (
                <WriteImg
                  key={getImageKey(imageSource, index)}
                  imageSource={imageSource}
                  style={[
                    hasTwoImages
                      ? styles.doubleImage
                      : styles.singleImage,
                    imageStyle,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      </Pressable>

      <ActionBar
        {...actionProps}
        font={normalizedFont}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minWidth: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    flexShrink: 0,

    flexDirection: 'column',
    alignItems: 'center',

    borderRadius: radius.S,
    overflow: 'hidden',

    backgroundColor: colors.bgLayerDefault,
  },

  pressArea: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    alignSelf: 'stretch',
  },

  contentArea: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    alignSelf: 'stretch',
  },

  textContainer: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    alignSelf: 'stretch',

    paddingVertical: padding.M,
    paddingHorizontal: padding.L,

    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'stretch',
  },

  textViewport: {
    flex: 1,
    minWidth: 0,

    justifyContent: 'flex-start',
    alignItems: 'stretch',

    overflow: 'hidden',
  },

  contentText: {
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    alignSelf: 'stretch',
    flexWrap: 'wrap',

    color: colors.fgNeutralMuted,
    textAlign: 'left',
  },

  imageContainer: {
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    alignSelf: 'stretch',

    paddingVertical: padding.XS,
    paddingHorizontal: padding.L,

    flexDirection: 'row',
    alignItems: 'flex-start',

    gap: gap.M,
  },

  singleImage: {
    width: '50%',
  },

  doubleImage: {
    width: 0,
    flex: 1,
  },
});

export default memo(PostCard);