import { useEffect, useState } from 'react';
import { AlphaType, ColorType, Skia, useImage } from '@shopify/react-native-skia';

import { colors } from '../styles/color';

const SAMPLE_SIZE = 32;
const MAX_COLOR_CANDIDATES = 12;
const MIN_ALPHA = 160;
const MIN_SOURCE_CHROMA = 0.06;
const MIN_SATURATION = 0.55;
const MAX_SATURATION = 0.92;
const MIN_LIGHTNESS = 0.42;
const MAX_LIGHTNESS = 0.6;
const FALLBACK_COLOR = colors.fgInformative;
const waveColorCache = new Map();

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const resolveImageSource = imageSource => {
  if (typeof imageSource === 'string' || typeof imageSource === 'number') return imageSource;
  if (typeof imageSource?.uri === 'string') return imageSource.uri;
  return null;
};

const getImageSourceKey = source => (source === null ? null : `${typeof source}:${source}`);

const rgbToHsl = ({ r, g, b }) => {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;

  if (delta === 0) return { h: 0, s: 0, l: lightness };

  let hue;
  if (max === red) hue = ((green - blue) / delta) % 6;
  else if (max === green) hue = (blue - red) / delta + 2;
  else hue = (red - green) / delta + 4;

  hue = (hue * 60 + 360) % 360;

  return {
    h: hue,
    s: delta / (1 - Math.abs(2 * lightness - 1)),
    l: lightness,
  };
};

const hueToRgb = (p, q, value) => {
  let t = value;
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
};

const hslToHex = ({ h, s, l }) => {
  let red = l;
  let green = l;
  let blue = l;

  if (s > 0) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue = h / 360;
    red = hueToRgb(p, q, hue + 1 / 3);
    green = hueToRgb(p, q, hue);
    blue = hueToRgb(p, q, hue - 1 / 3);
  }

  const toHex = value =>
    Math.round(clamp(value, 0, 1) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
};

const srgbToLinear = value => {
  const normalized = value / 255;
  if (normalized <= 0.04045) return normalized / 12.92;
  return ((normalized + 0.055) / 1.055) ** 2.4;
};

const rgbToOklab = ({ r, g, b }) => {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);

  return {
    l: 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot,
    a: 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot,
    b: 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot,
  };
};

const getLightnessPenalty = lightness => {
  let penalty = 0;

  if (lightness < 0.25) penalty += (0.25 - lightness) * 0.35;
  if (lightness > 0.88) penalty += (lightness - 0.88) * 0.35;
  if (lightness < 0.18) penalty += (0.18 - lightness) * 0.5;
  if (lightness > 0.93) penalty += (lightness - 0.93) * 0.5;

  return penalty;
};

const selectWaveColor = pixels => {
  const buckets = new Map();

  for (let index = 0; index < pixels.length; index += 4) {
    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];
    const a = pixels[index + 3];

    if (a < MIN_ALPHA) continue;

    const maxChannel = Math.max(r, g, b);
    const minChannel = Math.min(r, g, b);
    const normalizedLightness = (maxChannel + minChannel) / 510;

    if (normalizedLightness <= 0.08 || normalizedLightness >= 0.95) continue;

    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0 };

    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.count += 1;
    buckets.set(key, bucket);
  }

  const candidates = [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_COLOR_CANDIDATES);

  let selectedCandidate = null;

  candidates.forEach(bucket => {
    const rgb = {
      r: bucket.r / bucket.count,
      g: bucket.g / bucket.count,
      b: bucket.b / bucket.count,
    };

    const oklab = rgbToOklab(rgb);
    const chroma = Math.sqrt(oklab.a * oklab.a + oklab.b * oklab.b);
    const penalty = getLightnessPenalty(oklab.l);
    const score = chroma - penalty;

    if (!selectedCandidate || score > selectedCandidate.score) {
      selectedCandidate = { rgb, chroma, score };
    }
  });

  if (!selectedCandidate || selectedCandidate.chroma <= MIN_SOURCE_CHROMA) {
    return FALLBACK_COLOR;
  }

  const hsl = rgbToHsl(selectedCandidate.rgb);

  return hslToHex({
    h: hsl.h,
    s: clamp(hsl.s, MIN_SATURATION, MAX_SATURATION),
    l: clamp(hsl.l, MIN_LIGHTNESS, MAX_LIGHTNESS),
  });
};

const extractWaveColor = image => {
  const imageWidth = image.width();
  const imageHeight = image.height();

  if (imageWidth <= 0 || imageHeight <= 0) return FALLBACK_COLOR;

  const surface = Skia.Surface.MakeOffscreen(SAMPLE_SIZE, SAMPLE_SIZE);
  if (!surface) return FALLBACK_COLOR;

  const sourceSize = Math.min(imageWidth, imageHeight);
  const sourceX = (imageWidth - sourceSize) / 2;
  const sourceY = (imageHeight - sourceSize) / 2;

  surface.getCanvas().drawImageRect(
    image,
    Skia.XYWHRect(sourceX, sourceY, sourceSize, sourceSize),
    Skia.XYWHRect(0, 0, SAMPLE_SIZE, SAMPLE_SIZE),
    Skia.Paint(),
  );

  surface.flush();

  const pixels = surface.makeImageSnapshot().readPixels(0, 0, {
    width: SAMPLE_SIZE,
    height: SAMPLE_SIZE,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  });

  return pixels instanceof Uint8Array ? selectWaveColor(pixels) : FALLBACK_COLOR;
};

const useAlbumWaveColor = (imageSource, enabled = true) => {
  const source = resolveImageSource(imageSource);
  const sourceKey = getImageSourceKey(source);
  const cachedColor = sourceKey ? waveColorCache.get(sourceKey) : null;
  const image = useImage(enabled && source && !cachedColor ? source : null);
  const [waveColor, setWaveColor] = useState(cachedColor ?? FALLBACK_COLOR);

  useEffect(() => {
    if (!enabled || !sourceKey) {
      setWaveColor(FALLBACK_COLOR);
      return;
    }

    const cached = waveColorCache.get(sourceKey);
    if (cached) {
      setWaveColor(cached);
      return;
    }

    if (!image) {
      setWaveColor(FALLBACK_COLOR);
      return;
    }

    try {
      const extractedColor = extractWaveColor(image);
      waveColorCache.set(sourceKey, extractedColor);
      setWaveColor(extractedColor);
    } catch (error) {
      console.warn('앨범 커버 색상을 추출하지 못했습니다.', error);
      waveColorCache.set(sourceKey, FALLBACK_COLOR);
      setWaveColor(FALLBACK_COLOR);
    }
  }, [enabled, image, sourceKey]);

  return waveColor;
};

export default useAlbumWaveColor;