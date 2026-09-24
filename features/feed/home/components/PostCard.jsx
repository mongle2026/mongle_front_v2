import React, { memo, useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import ProfileBar from '../../components/ProfileBar';
import ActionBar from '../../../../shared/components/content/ActionBar';

import MusicCard from '../../../../shared/components/content/MusicCard';
import { WriteImg } from '../../../../shared/components/atomic/WriteImg';
import SuitSafeText from '../../../../shared/components/atomic/SuitSafeText';
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
              {hasContent && (
                <SuitSafeText
                  numberOfLines={textNumberOfLines}
                  ellipsizeMode="tail"
                  style={[
                    styles.contentText,
                    contentFontStyle,
                  ]}
                >
                  {content}
                </SuitSafeText>
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