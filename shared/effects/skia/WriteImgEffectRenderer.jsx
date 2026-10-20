import React, { memo, useCallback, useMemo, useState, } from 'react';
import { StyleSheet, View, } from 'react-native';
import { Canvas, Fill, Group, ImageShader, Shader, rect, rrect, useImage, vec, } from '@shopify/react-native-skia';
import { WRITE_IMG_PRINT_EFFECT, } from './writeImgPrintEffect';
import { WRITE_IMG_FILM_EFFECT, } from './writeImgFilmEffect';
import { getFilmToneScale, } from './measureImageTone';
import { toSkiaImageSource } from '../../utils/media';

/*
 * print: 하프톤 인쇄 질감 (편지, 작성 화면)
 * film : 필름카메라 보정 (피드 썸네일)
 */
export const WRITE_IMG_EFFECT_TYPE = Object.freeze({
  PRINT: 'print',
  FILM: 'film',
});

const DEFAULT_HALFTONE_OPTIONS =
  Object.freeze({
    dotSize: 4,
    dotScale: 1.33,
    softness: 1,
    rotation: 0,
  });

const DEFAULT_TEXTURE_OPTIONS =
  Object.freeze({
    size: 19.2,
    radius: 4,
  });

export const WriteImgEffectRenderer = memo(
  ({
    imageSource,
    style,
    borderRadius = 0,
    halftoneOptions = DEFAULT_HALFTONE_OPTIONS,
    textureOptions = DEFAULT_TEXTURE_OPTIONS,
    effect = WRITE_IMG_EFFECT_TYPE.PRINT,
    pointerEvents = 'auto',
  }) => {
    const isFilm = effect === WRITE_IMG_EFFECT_TYPE.FILM;

    // 필름 셰이더 컴파일에 실패했으면 null → 보정 없이 원본을 그린다
    const shaderSource = isFilm
      ? WRITE_IMG_FILM_EFFECT
      : WRITE_IMG_PRINT_EFFECT;

    const [layout, setLayout] = useState({
      width: 0,
      height: 0,
    });

    const currentImageSource = useMemo(
      () => toSkiaImageSource(imageSource),
      [imageSource]
    );

    const image = useImage(
      currentImageSource
    );

    // 원래 진한 사진은 채도를, 밝은 사진은 노출을 덜 올린다 (사진당 한 번만 계산)
    const {
      saturationScale,
      exposureScale,
    } = useMemo(() => getFilmToneScale(
      isFilm ? image : null,
      typeof currentImageSource === 'string'
        ? currentImageSource
        : null
    ), [
      currentImageSource,
      image,
      isFilm,
    ]);

    const handleLayout = useCallback(
      event => {
        const {
          width,
          height,
        } = event.nativeEvent.layout;

        setLayout(currentLayout => {
          const isSameLayout =
            currentLayout.width === width &&
            currentLayout.height === height;

          if (isSameLayout) {
            return currentLayout;
          }

          return {
            width,
            height,
          };
        });
      },
      []
    );

    const destinationRect = useMemo(() => {
      if (!layout.width || !layout.height) {
        return null;
      }

      return rect(
        0,
        0,
        layout.width,
        layout.height
      );
    }, [
      layout.height,
      layout.width,
    ]);

    const clipRect = useMemo(() => {
      if (!destinationRect) {
        return null;
      }

      return rrect(
        destinationRect,
        borderRadius,
        borderRadius
      );
    }, [
      borderRadius,
      destinationRect,
    ]);

    // 셰이더마다 선언한 uniform만 넘겨야 한다
    const uniforms = useMemo(() => {
      const resolution = vec(
        layout.width,
        layout.height
      );

      if (isFilm) {
        return {
          resolution,
          saturationScale,
          exposureScale,
        };
      }

      return {
        resolution,

        dotSize:
          halftoneOptions.dotSize,

        dotScale:
          halftoneOptions.dotScale,

        softness:
          halftoneOptions.softness,

        rotation:
          halftoneOptions.rotation,

        grainSize:
          textureOptions.size,

        grainRadius:
          textureOptions.radius,
      };
    }, [
      halftoneOptions.dotScale,
      halftoneOptions.dotSize,
      halftoneOptions.rotation,
      exposureScale,
      halftoneOptions.softness,
      isFilm,
      layout.height,
      layout.width,
      saturationScale,
      textureOptions.radius,
      textureOptions.size,
    ]);

    const canRender =
      image &&
      destinationRect &&
      clipRect;

    return (
      <View
        pointerEvents={pointerEvents}
        style={[
          styles.container,
          style,
        ]}
        onLayout={handleLayout}
      >
        {canRender && (
          <Canvas
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          >
            <Group clip={clipRect}>
              <Fill>
                {shaderSource ? (
                  <Shader
                    source={shaderSource}
                    uniforms={uniforms}
                  >
                    <ImageShader
                      image={image}
                      fit="cover"
                      rect={destinationRect}
                    />
                  </Shader>
                ) : (
                  <ImageShader
                    image={image}
                    fit="cover"
                    rect={destinationRect}
                  />
                )}
              </Fill>
            </Group>
          </Canvas>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
});