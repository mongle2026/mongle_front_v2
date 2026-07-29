import React, { memo, useCallback, useMemo, useState, } from 'react';
import { StyleSheet, View, } from 'react-native';
import { Canvas, Fill, Group, ImageShader, Shader, rect, rrect, useImage, vec, } from '@shopify/react-native-skia';
import { WRITE_IMG_PRINT_EFFECT, } from './writeImgPrintEffect';

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

const normalizeImageSource = imageSource => {
  if (
    typeof imageSource === 'string' ||
    typeof imageSource === 'number'
  ) {
    return imageSource;
  }

  if (
    imageSource &&
    typeof imageSource === 'object' &&
    imageSource.uri
  ) {
    return imageSource.uri;
  }

  return imageSource;
};

export const WriteImgEffectRenderer = memo(
  ({
    imageSource,
    style,
    borderRadius = 0,
    halftoneOptions =
      DEFAULT_HALFTONE_OPTIONS,
    textureOptions =
      DEFAULT_TEXTURE_OPTIONS,
  }) => {
    const [layout, setLayout] = useState({
      width: 0,
      height: 0,
    });

    const currentImageSource = useMemo(
      () => normalizeImageSource(imageSource),
      [imageSource]
    );

    const image = useImage(
      currentImageSource
    );

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

    const uniforms = useMemo(
      () => ({
        resolution: vec(
          layout.width,
          layout.height
        ),

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
      }),
      [
        halftoneOptions.dotScale,
        halftoneOptions.dotSize,
        halftoneOptions.rotation,
        halftoneOptions.softness,
        layout.height,
        layout.width,
        textureOptions.radius,
        textureOptions.size,
      ]
    );

    const canRender =
      image &&
      destinationRect &&
      clipRect;

    return (
      <View
        style={[
          styles.container,
          style,
        ]}
        onLayout={handleLayout}
      >
        {canRender && (
          <Canvas
            style={
              StyleSheet.absoluteFill
            }
          >
            <Group clip={clipRect}>
              <Fill>
                <Shader
                  source={
                    WRITE_IMG_PRINT_EFFECT
                  }
                  uniforms={uniforms}
                >
                  <ImageShader
                    image={image}
                    fit="cover"
                    rect={
                      destinationRect
                    }
                  />
                </Shader>
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