import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import SuitSafeText from '../../../../shared/components/atomic/SuitSafeText';
import { WriteImg } from '../../../../shared/components/atomic/WriteImg';
import useWriteImgRatio from '../../../../shared/hooks/useWriteImgRatio';
import { colors } from '../../../../shared/styles/color';
import { FONT } from '../../../../shared/styles/font';
import { gap, padding } from '../../../../shared/styles/token';
import { typo } from '../../../../shared/styles/typo';

const FONT_STYLES = Object.freeze({
  [FONT.KYOBO]: typo.kyoboBodyLarge,
  [FONT.SUIT]: typo.suitBodyLarge,
});

const getImageKey = (imageSource, index) => {
  if (typeof imageSource === 'string') return `${imageSource}-${index}`;
  if (imageSource && typeof imageSource === 'object' && imageSource.uri) return `${imageSource.uri}-${index}`;

  return `letter-image-${index}`;
};

// 가로 사진 4:3, 세로 사진 5:6
const LetterImage = ({ imageSource }) => {
  const ratio = useWriteImgRatio(imageSource);

  return <WriteImg imageSource={imageSource} ratio={ratio} style={styles.image} />;
};

const LetterDetailContent = ({ text = '', imageSources = [], font = FONT.KYOBO }) => {
  const hasText = typeof text === 'string' && text.trim().length > 0;
  const visibleImages = imageSources.filter(Boolean);
  const fontStyle = FONT_STYLES[font] ?? FONT_STYLES[FONT.KYOBO];

  return (
    <View style={styles.textContainer}>
      {hasText && <SuitSafeText style={[styles.text, fontStyle]}>{text}</SuitSafeText>}

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
    color: colors.fgNeutralMuted,
  },
  image: {
    width: '100%',
    alignSelf: 'stretch',
  },
});

export default memo(LetterDetailContent);
