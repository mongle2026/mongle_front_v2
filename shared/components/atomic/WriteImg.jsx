import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import { WriteImgEffectRenderer } from '../../effects/skia/WriteImgEffectRenderer';
import { radius } from '../../styles/token';

export const WRITE_IMG_RATIO = Object.freeze({
  FOUR_THREE: '4:3',
  FIVE_SIX: '5:6',
});

const WRITE_IMG_ASPECT_RATIO = Object.freeze({
  [WRITE_IMG_RATIO.FOUR_THREE]: 4 / 3,
  [WRITE_IMG_RATIO.FIVE_SIX]: 5 / 6,
});

const WRITE_IMG_HALFTONE_OPTIONS = Object.freeze({
  dotSize: 4,
  dotScale: 1.33,
  softness: 1,
  rotation: 0,
});

const WRITE_IMG_TEXTURE_OPTIONS = Object.freeze({
  size: 19.2,
  radius: 4,
});

export const WriteImg = memo(
  ({
    imageSource,
    style,
    pointerEvents,
    ratio = WRITE_IMG_RATIO.FOUR_THREE,
  }) => {
    const aspectRatio =
      WRITE_IMG_ASPECT_RATIO[ratio] ??
      WRITE_IMG_ASPECT_RATIO[WRITE_IMG_RATIO.FOUR_THREE];

    return (
      <WriteImgEffectRenderer
        imageSource={imageSource}
        pointerEvents={pointerEvents}
        style={[
          styles.container,
          { aspectRatio },
          style,
        ]}
        borderRadius={2}
        halftoneOptions={WRITE_IMG_HALFTONE_OPTIONS}
        textureOptions={WRITE_IMG_TEXTURE_OPTIONS}
      />
    );
  },
);

const styles = StyleSheet.create({
  container: {
    width: '50%',

    justifyContent: 'center',
    alignItems: 'center',

    borderRadius: radius.XS,
  },
});