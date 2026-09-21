import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WriteImg } from '../../../../shared/components/atomic/WriteImg';
import SuitSafeText from '../../../../shared/components/atomic/SuitSafeText';

import useWriteImgRatio from '../../../../shared/hooks/useWriteImgRatio';

import { colors } from '../../../../shared/styles/color';
import { getImageKey } from '../../../../shared/utils/media';
import { FONT, getBodyFontStyle } from '../../../../shared/styles/fontType';
import { gap, padding } from '../../../../shared/styles/token';

const DETAIL_CONTENT_MIN_HEIGHT = 418;

// 가로 사진 4:3, 세로 사진 5:6
const DetailImage = ({ imageSource, onPress }) => {
  const ratio = useWriteImgRatio(imageSource);

  return (
    <Pressable onPress={onPress} style={styles.imageButton}>
      <WriteImg
        imageSource={imageSource}
        ratio={ratio}
        pointerEvents="none"
        style={styles.image}
      />
    </Pressable>
  );
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
  const fontStyle = getBodyFontStyle(font);

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
            <DetailImage
              key={getImageKey(imageSource, index)}
              imageSource={imageSource}
              onPress={() => onPressImage?.(imageSource, index)}
            />
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