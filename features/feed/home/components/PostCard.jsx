import React, { memo, useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import ProfileBar from '../../components/ProfileBar';
import ActionBar from '../../../../shared/components/content/ActionBar';

import MusicCard from '../../../../shared/components/content/MusicCard';
import { WriteImg } from '../../../../shared/components/atomic/WriteImg';
import FontFallbackText from '../../../../shared/components/atomic/FontFallbackText';
import usePressAnimation from '../../../../shared/hooks/usePressAnimation';
import { colors } from '../../../../shared/styles/color';
import { getImageKey } from '../../../../shared/utils/media';
import { gap, padding, radius } from '../../../../shared/styles/token';
import { FONT, getBodyFontStyle, normalizeFont } from '../../../../shared/styles/fontType';

const TEXT_LINES_WITH_IMAGES = 8;
const TEXT_LINES_WITHOUT_IMAGES = 13;

const PostCard = ({
  profileProps,
  musicProps,
  actionProps,
  onPress,
  content,
  imageSources = [],
  font = FONT.KYOBO,
  style,
}) => {
  const { animatedStyle, pressHandlers } = usePressAnimation({ onPress });

  // textViewport가 실제로 차지하는 높이를 측정해서, 남는 공간이 있으면
  // 고정 줄 수(TEXT_LINES_*)보다 더 많은 줄을 보여주기 위한 값
  const [textViewportHeight, setTextViewportHeight] = useState(0);

  const handleTextViewportLayout = useCallback(event => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    setTextViewportHeight(currentHeight => (currentHeight === nextHeight ? currentHeight : nextHeight));
  }, []);

  const hasContent =
    typeof content === 'string' && content.trim().length > 0;

  const visibleImages = imageSources.filter(Boolean).slice(0, 2);
  const hasImages = visibleImages.length > 0;
  const hasTwoImages = visibleImages.length === 2;

  const normalizedFont = normalizeFont(font);

  const contentFontStyle =
    getBodyFontStyle(normalizedFont);

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

  // iOS는 numberOfLines의 마지막 줄이 빈 줄이거나 문단 끝에서 끝나면 말줄임표 대신
  // 아래 문단을 끌어오거나 '…' 없이 잘라버린다. 숨긴 Text로 전체 줄을 측정해서,
  // 뒤에 글이 더 남아 있으면 마지막 보이는 줄 끝에 항상 '…'을 붙이도록 직접 자른다.
  const [contentLines, setContentLines] = useState(null);

  const handleMeasureTextLayout = useCallback(event => {
    const nextLines = event.nativeEvent.lines.map(line => line.text);
    setContentLines(currentLines =>
      currentLines &&
      currentLines.length === nextLines.length &&
      currentLines.every((line, index) => line === nextLines[index])
        ? currentLines
        : nextLines,
    );
  }, []);

  const shouldMeasureContent = Platform.OS === 'ios' && hasContent;

  const hasHiddenLines =
    shouldMeasureContent &&
    contentLines !== null &&
    contentLines.length > textNumberOfLines;

  // 마지막 보이는 줄의 끝 공백/줄바꿈을 지우고 '…'을 붙인다. 빈 줄이면 그 자리에 '…'만 남는다.
  // '…'을 붙여 줄이 넘치면 numberOfLines + ellipsizeMode가 iOS 기본 말줄임으로 처리한다.
  const displayContent = hasHiddenLines
    ? `${contentLines.slice(0, textNumberOfLines - 1).join('')}${contentLines[textNumberOfLines - 1].trimEnd()}…`
    : content;

  return (
    <Animated.View
      style={[
        styles.card,
        style,
        animatedStyle,
      ]}
    >
      {/*
        팔로우/재생 버튼은 gesture-handler Pressable이라 카드 Pressable과 터치를 공유하지 않습니다.
        카드 Pressable 밖에 형제로 두어 버튼 터치가 상세 이동으로 이어지지 않도록 합니다.
        MusicCard는 재생 버튼을 제외한 영역에 카드와 같은 press 핸들러를 연결합니다.
      */}
      <ProfileBar
        {...profileProps}
        font={normalizedFont}
      />

      <MusicCard
        {...musicProps}
        font={normalizedFont}
        {...pressHandlers}
      />

      <Pressable
        {...pressHandlers}
        style={styles.pressArea}
      >
        <View style={styles.contentArea}>
          <View style={styles.textContainer}>
            <View style={styles.textViewport} onLayout={handleTextViewportLayout}>
              {shouldMeasureContent && (
                <FontFallbackText
                  aria-hidden
                  pointerEvents="none"
                  onTextLayout={handleMeasureTextLayout}
                  style={[
                    styles.contentText,
                    contentFontStyle,
                    styles.measureText,
                  ]}
                >
                  {content}
                </FontFallbackText>
              )}
              {hasContent && (
                <FontFallbackText
                  numberOfLines={textNumberOfLines}
                  ellipsizeMode="tail"
                  style={[
                    styles.contentText,
                    contentFontStyle,
                  ]}
                >
                  {displayContent}
                </FontFallbackText>
              )}
            </View>
          </View>

          {hasImages && (
            <View style={styles.imageContainer}>
              {visibleImages.map((imageSource, index) => (
                <WriteImg
                  key={getImageKey(imageSource, index)}
                  imageSource={imageSource}
                  style={
                    hasTwoImages
                      ? styles.doubleImage
                      : styles.singleImage
                  }
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

    backgroundColor: colors.bgSurface,
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

    color: colors.fgNeutralSecondary,
    textAlign: 'left',
  },

  measureText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    opacity: 0,
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