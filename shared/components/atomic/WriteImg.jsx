import React, { memo } from 'react';
import { StyleSheet, } from 'react-native';
import { WriteImgEffectRenderer, } from '../../effects/skia/WriteImgEffectRenderer';
import { radius } from '../../styles/token';

const WRITE_IMG_HALFTONE_OPTIONS =
  Object.freeze({
    dotSize: 4,
    dotScale: 1.33,
    softness: 1,
    rotation: 0,
  });

const WRITE_IMG_TEXTURE_OPTIONS =
  Object.freeze({
    size: 19.2,
    radius: 4,
  });

export const WriteImg = memo(
  ({
    imageSource,
    style,
  }) => {
    return (
      <WriteImgEffectRenderer
        imageSource={imageSource}
        style={[
          styles.container,
          style,
        ]}
        borderRadius={2}
        halftoneOptions={
          WRITE_IMG_HALFTONE_OPTIONS
        }
        textureOptions={
          WRITE_IMG_TEXTURE_OPTIONS
        }
      />
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: '50%',
    aspectRatio: 4 / 3,

    justifyContent: 'center',
    alignItems: 'center',

    borderRadius: radius.XS,
  },
});