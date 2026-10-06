import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import FontFallbackText from '../../../../../shared/components/atomic/FontFallbackText';
import { WriteImg } from '../../../../../shared/components/atomic/WriteImg';
import useWriteImgRatio from '../../../../../shared/hooks/useWriteImgRatio';
import { colors } from '../../../../../shared/styles/color';
import { getImageKey } from '../../../../../shared/utils/media';
import { FONT, getBodyFontStyle } from '../../../../../shared/styles/fontType';
import { gap, padding } from '../../../../../shared/styles/token';

// 가로 사진 4:3, 세로 사진 5:6
const LetterImage = ({ imageSource }) => {
  const ratio = useWriteImgRatio(imageSource);

  return <WriteImg imageSource={imageSource} ratio={ratio} style={styles.image} />;
};

const LetterDetailContent = ({ text = '', imageSources = [], font = FONT.KYOBO }) => {
  const hasText = typeof text === 'string' && text.trim().length > 0;
  const visibleImages = imageSources.filter(Boolean);
  const fontStyle = getBodyFontStyle(font);

  return (
    <View style={styles.textContainer}>
      {hasText && <FontFallbackText style={[styles.text, fontStyle]}>{text}</FontFallbackText>}

      {visibleImages.map((imageSource, index) => (
        <LetterImage key={getImageKey(imageSource, index)} imageSource={imageSource} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  textContainer: {
    alignSelf: 'stretch',
    paddingVertical: padding.M,
    paddingHorizontal: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.M,
  },
  text: {
    width: '100%',
    color: colors.fgNeutralSecondary,
  },
  image: {
    width: '100%',
    alignSelf: 'stretch',
  },
});

export default memo(LetterDetailContent);
