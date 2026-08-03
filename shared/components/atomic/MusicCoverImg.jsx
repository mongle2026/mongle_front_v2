import React, { memo, useMemo, } from 'react';
import { StyleSheet, View, } from 'react-native';
import { Canvas, Fill, Group, ImageShader, Shader, rect, rrect, useImage, vec, } from '@shopify/react-native-skia';

import { MUSIC_COVER_HALFTONE_EFFECT, } from '../../effects/skia/musicCoverHalftoneEffect';

import { radius, } from '../../styles/token';

export const MUSIC_COVER_SIZES =
  Object.freeze({
    M: 72,
  });

/*
 * 디자인팀 전달값을 기본 프리셋으로 고정합니다.
 * 각 값은 props로 덮어쓸 수 있습니다.
 */
export const MUSIC_COVER_HALFTONE_PRESET =
  Object.freeze({
    dotSize: 4,
    dotScale: 0.8,
    softness: 1,
  });

const resolveMusicCoverSize = size => {
  if (
    typeof size === 'number' &&
    Number.isFinite(size) &&
    size > 0
  ) {
    return size;
  }

  return (
    MUSIC_COVER_SIZES[size] ??
    MUSIC_COVER_SIZES.M
  );
};

const resolveImageSource = imageSource => {
  if (!imageSource) {
    return null;
  }

  if (
    typeof imageSource === 'object' &&
    typeof imageSource.uri === 'string'
  ) {
    return imageSource.uri;
  }

  return imageSource;
};

const resolvePositiveNumber = (
  value,
  fallback
) => {
  if (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0
  ) {
    return value;
  }

  return fallback;
};

const MusicCoverImg = ({
  imageSource,
  size = 'M',
  style,
  accessibilityLabel = '앨범 커버',

  dotSize =
    MUSIC_COVER_HALFTONE_PRESET.dotSize,

  dotScale =
    MUSIC_COVER_HALFTONE_PRESET.dotScale,

  softness =
    MUSIC_COVER_HALFTONE_PRESET.softness,
}) => {
  const currentSize =
    resolveMusicCoverSize(size);

  const currentImageSource = useMemo(
    () => resolveImageSource(
      imageSource
    ),
    [imageSource]
  );

  const currentDotSize =
    resolvePositiveNumber(
      dotSize,
      MUSIC_COVER_HALFTONE_PRESET.dotSize
    );

  const currentDotScale =
    resolvePositiveNumber(
      dotScale,
      MUSIC_COVER_HALFTONE_PRESET.dotScale
    );

  const currentSoftness =
    resolvePositiveNumber(
      softness,
      MUSIC_COVER_HALFTONE_PRESET.softness
    );

  const image = useImage(
    currentImageSource
  );

  const destinationRect = useMemo(
    () =>
      rect(
        0,
        0,
        currentSize,
        currentSize
      ),
    [currentSize]
  );

  const clipRect = useMemo(
    () =>
      rrect(
        destinationRect,
        radius.XS,
        radius.XS
      ),
    [destinationRect]
  );

  const uniforms = useMemo(
    () => ({
      /*
       * 디자인팀 조건:
       * 그리드는 화면 좌표 기준으로 계산합니다.
       */
      resolution: vec(
        currentSize,
        currentSize
      ),

      /*
       * 디자인팀 기본값:
       * dotSize 4
       * dotScale 0.8
       * softness 1
       *
       * 필요할 때만 컴포넌트 props로 조절합니다.
       */
      dotSize: currentDotSize,
      dotScale: currentDotScale,
      softness: currentSoftness,
    }),
    [
      currentSize,
      currentDotSize,
      currentDotScale,
      currentSoftness,
    ]
  );

  const canRender =
    Boolean(
      image &&
      destinationRect &&
      clipRect
    );

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        accessibilityLabel
      }
      style={[
        styles.container,
        style,
        {
          width: currentSize,
          height: currentSize,
        },
      ]}
    >
      {canRender && (
        <Canvas
          pointerEvents="none"
          style={
            StyleSheet.absoluteFill
          }
        >
          <Group clip={clipRect}>
            <Fill>
              <Shader
                source={
                  MUSIC_COVER_HALFTONE_EFFECT
                }
                uniforms={uniforms}
              >
                <ImageShader
                  image={image}
                  fit="cover"
                  rect={destinationRect}
                />
              </Shader>
            </Fill>
          </Group>
        </Canvas>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexShrink: 0,
    overflow: 'hidden',
    borderRadius: radius.XS,
  },
});

export default memo(MusicCoverImg);