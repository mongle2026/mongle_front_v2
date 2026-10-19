import {
  AlphaType,
  ColorType,
  FilterMode,
  MipmapMode,
  Skia,
} from '@shopify/react-native-skia';

/*
 * 원본 사진의 채도·밝기를 재서 필름 보정 강도를 사진마다 맞춥니다.
 * 사진을 32x32 로 줄여 그린 뒤 평균을 구합니다.
 *
 * 채도 (픽셀마다 가장 밝은 채널 - 가장 어두운 채널의 평균)
 * - SATURATION_LOW 이하: 배율 1 (필터 그대로)
 * - SATURATION_HIGH 이상: MIN_SATURATION_SCALE 까지 채도를 낮춤
 *
 * 밝기 (평균 밝기)
 * - BRIGHTNESS_LOW 이하: 배율 1 (필터 그대로)
 * - BRIGHTNESS_HIGH 이상: MIN_EXPOSURE_SCALE 까지 노출을 덜 올림
 *
 * 그 사이는 부드럽게 이어지고, 같은 사진은 항상 같은 값이 나오므로
 * 화면을 다시 열어도 결과가 같습니다.
 */
const SAMPLE_SIZE = 32;

const SATURATION_LOW = 0.12;
const SATURATION_HIGH = 0.3;
const MIN_SATURATION_SCALE = 0.75;

const BRIGHTNESS_LOW = 0.4;
const BRIGHTNESS_HIGH = 0.65;
const MIN_EXPOSURE_SCALE = 0.78;

const DEFAULT_TONE = Object.freeze({
  saturationScale: 1,
  exposureScale: 1,
});

// 피드를 오래 내려도 메모리가 계속 늘지 않게 최근 것만 기억합니다.
const CACHE_LIMIT = 300;
const toneCache = new Map();

const smoothstep = (edge0, edge1, value) => {
  const t = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);

  return t * t * (3 - 2 * t);
};

const readAverageTone = image => {
  const surface = Skia.Surface.Make(SAMPLE_SIZE, SAMPLE_SIZE);
  if (!surface) return null;

  surface.getCanvas().drawImageRectOptions(
    image,
    Skia.XYWHRect(0, 0, image.width(), image.height()),
    Skia.XYWHRect(0, 0, SAMPLE_SIZE, SAMPLE_SIZE),
    FilterMode.Linear,
    MipmapMode.Linear,
    Skia.Paint(),
  );
  surface.flush();

  const pixels = surface.makeImageSnapshot().readPixels(0, 0, {
    width: SAMPLE_SIZE,
    height: SAMPLE_SIZE,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  });
  if (!pixels?.length) return null;

  let saturationTotal = 0;
  let brightnessTotal = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];

    saturationTotal += Math.max(red, green, blue) - Math.min(red, green, blue);
    brightnessTotal += 0.299 * red + 0.587 * green + 0.114 * blue;
  }

  const pixelCount = pixels.length / 4;

  return {
    saturation: saturationTotal / pixelCount / 255,
    brightness: brightnessTotal / pixelCount / 255,
  };
};

/**
 * 필름 셰이더에 넘길 사진별 배율
 * - saturationScale: MIN_SATURATION_SCALE ~ 1
 * - exposureScale  : MIN_EXPOSURE_SCALE ~ 1
 * 재지 못하면 둘 다 1 이라 필터를 그대로 적용합니다.
 */
export const getFilmToneScale = (image, cacheKey) => {
  if (!image) return DEFAULT_TONE;

  if (cacheKey && toneCache.has(cacheKey)) {
    return toneCache.get(cacheKey);
  }

  let tone = DEFAULT_TONE;

  try {
    const average = readAverageTone(image);

    if (average) {
      const saturationAmount = smoothstep(
        SATURATION_LOW,
        SATURATION_HIGH,
        average.saturation,
      );

      const brightnessAmount = smoothstep(
        BRIGHTNESS_LOW,
        BRIGHTNESS_HIGH,
        average.brightness,
      );

      tone = {
        saturationScale:
          1 - (1 - MIN_SATURATION_SCALE) * saturationAmount,
        exposureScale:
          1 - (1 - MIN_EXPOSURE_SCALE) * brightnessAmount,
      };
    }
  } catch (error) {
    console.warn('사진 채도·밝기를 재지 못했습니다.', error);
  }

  if (cacheKey) {
    if (toneCache.size >= CACHE_LIMIT) {
      toneCache.delete(toneCache.keys().next().value);
    }

    toneCache.set(cacheKey, tone);
  }

  return tone;
};
