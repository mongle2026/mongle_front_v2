import React, { memo, useMemo, } from 'react';
import { PixelRatio, StyleSheet, View, } from 'react-native';
import { Canvas, Group, Image, Paint, RuntimeShader, useImage, } from '@shopify/react-native-skia';
import { MUSIC_COVER_HALFTONE_EFFECT, } from '../../effects/skia/musicCoverHalftoneEffect';
import { radius } from '../../styles/token';

export const MUSIC_COVER_SIZES = Object.freeze({
  M: 72,
});

export const MUSIC_COVER_HALFTONE_PRESET =
  Object.freeze({
    dotSize: 4,
    dotScale: 0.8,
    softness: 1,
  });

const PIXEL_RATIO = PixelRatio.get();

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

const MusicCoverImg = ({
  imageSource,
  size = 'M',
  style,
  accessibilityLabel = '앨범 커버',

  /*
   * Figma export와 비교하며 튜닝할 수 있도록
   * 파라미터를 props로 열어둡니다.
   *
   * 전달하지 않으면 MusicCover 전용 프리셋이 적용됩니다.
   */
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
    () => resolveImageSource(imageSource),
    [imageSource]
  );

  const image = useImage(
    currentImageSource
  );

  const uniforms = useMemo(
    () => ({
      /*
       * RuntimeShader는 PixelRatio를 자동 반영하지 않습니다.
       * supersampling 배율에 맞춰 화면상의 4dp와 1dp를
       * 실제 셰이더 좌표로 변환합니다.
       */
      dotSize:
        dotSize * PIXEL_RATIO,

      dotScale,

      softness:
        softness * PIXEL_RATIO,
    }),
    [
      dotSize,
      dotScale,
      softness,
    ]
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
      {image && (
        <Canvas style={styles.canvas}>
          <Group
            transform={[
              {
                scale:
                  1 / PIXEL_RATIO,
              },
            ]}
          >
            <Group
              transform={[
                {
                  scale:
                    PIXEL_RATIO,
                },
              ]}
              layer={
                <Paint>
                  <RuntimeShader
                    source={
                      MUSIC_COVER_HALFTONE_SHADER
                    }
                    uniforms={
                      uniforms
                    }
                  />
                </Paint>
              }
            >
              <Image
                image={image}
                x={0}
                y={0}
                width={currentSize}
                height={currentSize}
                fit="cover"
              />
            </Group>
          </Group>
        </Canvas>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexShrink: 0,
    overflow: 'hidden',
    borderRadius: radius.XS,
  },

  canvas: {
    flex: 1,
  },
});

export default memo(MusicCoverImg);