import React, { memo, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import {
  WRITE_IMG_EFFECT_TYPE,
  WriteImgEffectRenderer,
} from '../../effects/skia/WriteImgEffectRenderer';
import { radius } from '../../styles/token';
import { toImageSource } from '../../utils/media';

export const WRITE_IMG_RATIO = Object.freeze({
  FOUR_THREE: '4:3',
  FIVE_SIX: '5:6',
});

/*
 * print: 하프톤 인쇄 질감 (기본값, 편지·작성 화면)
 * film : 필름카메라 보정 (피드 썸네일)
 * none : 보정 없는 원본 (게시물 상세)
 */
export const WRITE_IMG_EFFECT = Object.freeze({
  ...WRITE_IMG_EFFECT_TYPE,
  NONE: 'none',
});

const WRITE_IMG_ASPECT_RATIO = Object.freeze({
  [WRITE_IMG_RATIO.FOUR_THREE]: 4 / 3,
  [WRITE_IMG_RATIO.FIVE_SIX]: 5 / 6,
});

// 원본 크기 → WriteImg 비율. 세로 사진은 5:6, 가로·1:1 사진과 크기를 모를 때는 4:3
export const getWriteImgRatio = ({ width, height } = {}) => {
  if (!width || !height) return WRITE_IMG_RATIO.FOUR_THREE;

  return height > width ? WRITE_IMG_RATIO.FIVE_SIX : WRITE_IMG_RATIO.FOUR_THREE;
};

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
    borderRadius = radius.M,
    effect = WRITE_IMG_EFFECT.PRINT,
  }) => {
    const aspectRatio =
      WRITE_IMG_ASPECT_RATIO[ratio] ??
      WRITE_IMG_ASPECT_RATIO[WRITE_IMG_RATIO.FOUR_THREE];

    const containerStyle = [
      styles.container,
      { aspectRatio, borderRadius },
      style,
    ];

    const originalSource = useMemo(
      () => toImageSource(imageSource),
      [imageSource],
    );

    // 원본은 Skia를 거치지 않고 그대로 그린다
    if (effect === WRITE_IMG_EFFECT.NONE) {
      return (
        <View
          pointerEvents={pointerEvents}
          style={[containerStyle, styles.originalContainer]}
        >
          {originalSource && (
            <Image
              source={originalSource}
              resizeMode="cover"
              style={StyleSheet.absoluteFill}
            />
          )}
        </View>
      );
    }

    return (
      <WriteImgEffectRenderer
        imageSource={imageSource}
        pointerEvents={pointerEvents}
        style={containerStyle}
        borderRadius={borderRadius}
        effect={effect}
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
  },

  originalContainer: {
    overflow: 'hidden',
  },
});