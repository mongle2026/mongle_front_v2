import React, { memo } from 'react';
import { Blur, ColorMatrix, Rect, Turbulence, vec, } from '@shopify/react-native-skia';

const GRAYSCALE_MATRIX = [
  0.2126, 0.7152, 0.0722, 0, 0,
  0.2126, 0.7152, 0.0722, 0, 0,
  0.2126, 0.7152, 0.0722, 0, 0,
  0,      0,      0,      1, 0,
];

const DEFAULT_TEXTURE_SIZE = 58.4;
const DEFAULT_TEXTURE_RADIUS = 3.1;
const DEFAULT_TEXTURE_OPACITY = 0.12;

const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

export const DividerLineTextureEffect = memo(
  ({
    x = 0,
    y = 0,
    width,
    height,
    size = DEFAULT_TEXTURE_SIZE,
    radius = DEFAULT_TEXTURE_RADIUS,
    opacity = DEFAULT_TEXTURE_OPACITY,
    seed = 12,
  }) => {
    const frequency = clamp(size / 1000, 0.001, 1);
    const blurSigma = radius / 3;

    return (
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        opacity={opacity}
        blendMode="multiply"
      >
        <Turbulence
          freqX={frequency}
          freqY={frequency}
          octaves={3}
          seed={seed}
        />

        <ColorMatrix matrix={GRAYSCALE_MATRIX} />

        <Blur
          blur={vec(blurSigma, 0)}
          mode="decal"
        />
      </Rect>
    );
  },
);

DividerLineTextureEffect.displayName = 'DividerLineTextureEffect';