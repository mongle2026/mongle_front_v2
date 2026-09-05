import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WriteImg } from '../../../../shared/components/atomic/WriteImg';
import SuitSafeText from '../../../../shared/components/atomic/SuitSafeText';

import { colors } from '../../../../shared/styles/color';
import { FONT } from '../../../../shared/styles/font';
import { gap, padding } from '../../../../shared/styles/token';
import { typo } from '../../../../shared/styles/typo';

const DETAIL_CONTENT_MIN_HEIGHT = 418;

const FONT_STYLES = Object.freeze({
  [FONT.KYOBO]: typo.kyoboBodyLarge,
  [FONT.SUIT]: typo.suitBodyLarge,
});

const getImageKey = (imageSource, index) => {
  if (typeof imageSource === 'string') return `${imageSource}-${index}`;
  if (imageSource && typeof imageSource === 'object' && imageSource.uri) return `${imageSource.uri}-${index}`;

  return `detail-image-${index}`;
};

const FeedDetailContent = ({
  content = '',
  imageSources = [],
  font = FONT.KYOBO,
  onPress,
  onPressImage,
}) => {
  const hasContent = typeof content === 'string' && content.trim().length > 0;
  const visibleImages = imageSources.filter(Boolean);
  const fontStyle = FONT_STYLES[font] ?? FONT_STYLES[FONT.KYOBO];

  return (
    <Pressable onPress={onPress} style={styles.container}>
      {hasContent && (
        <View style={styles.textContainer}>
          <SuitSafeText style={[styles.contentText, fontStyle]}>
            {content}
          </SuitSafeText>
        </View>
      )}

      {visibleImages.length > 0 && (
        <View style={styles.imgContainer}>
          {visibleImages.map((imageSource, index) => (
            <Pressable
              key={getImageKey(imageSource, index)}
              onPress={() => onPressImage?.(imageSource, index)}
              style={styles.imageButton}
            >
              <WriteImg
                imageSource={imageSource}
                pointerEvents="none"
                style={styles.image}
              />
            </Pressable>
          ))}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: DETAIL_CONTENT_MIN_HEIGHT,
    alignSelf: 'stretch',
    alignItems: 'flex-start',
  },

  textContainer: {
    width: '100%',
    paddingVertical: padding.XXS,
    paddingHorizontal: padding.L,
    alignItems: 'flex-start',
  },

  contentText: {
    width: '100%',
    flexWrap: 'wrap',
    color: colors.fgNeutralMuted,
    textAlign: 'justify',
  },

  imgContainer: {
    width: '100%',
    paddingTop: 0,
    paddingBottom: padding.M,
    paddingHorizontal: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.M,
  },

  imageButton: {
    width: '100%',
    alignSelf: 'stretch',
  },

  image: {
    width: '100%',
    alignSelf: 'stretch',
  },
});

export default memo(FeedDetailContent);