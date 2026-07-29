import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Rect, } from '@shopify/react-native-skia';

import { DividerLineTextureEffect } from '../../effects/skia/dividerLineTextureEffect';
import { colors } from '../../styles/color';

const DEFAULT_WIDTH = 335;
const LINE_HEIGHT = 1;

export const DividerLine = memo(
  ({
    width = DEFAULT_WIDTH,
    color = colors.strokeBrandSubtle,
    textureOpacity = 0.12,
    style,
  }) => {
    return (
      <View
        accessible={false}
        pointerEvents="none"
        style={[
          styles.container,
          {
            width,
            height: LINE_HEIGHT,
          },
          style,
        ]}
      >
        <Canvas style={styles.canvas}>
          <Rect
            x={0}
            y={0}
            width={width}
            height={LINE_HEIGHT}
            color={color}
          />

          <DividerLineTextureEffect
            width={width}
            height={LINE_HEIGHT}
            opacity={textureOpacity}
          />
        </Canvas>
      </View>
    );
  },
);

DividerLine.displayName = 'DividerLine';

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },

  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
});