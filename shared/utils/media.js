import { Image as ExpoImage } from 'expo-image';

export const resolveMediaUri = uri => {
  if (typeof uri !== 'string') return null;

  const normalizedUri = uri.trim();
  if (!normalizedUri) return null;

  return normalizedUri;
};

// uri 문자열 → Image source. 이미 source 객체/require 숫자면 그대로, 없으면 undefined
export const toImageSource = source => {
  if (!source) return undefined;
  if (typeof source === 'string') return { uri: source };

  return source;
};

// Image source → Skia useImage 가 받는 값(uri 문자열 또는 require 숫자)
export const toSkiaImageSource = source => {
  if (!source) return null;
  if (typeof source === 'object' && typeof source.uri === 'string') return source.uri;

  return source;
};

/*
 * 사진을 크게 볼 때(ImageViewer) 쓰는 expo-image 캐시 정책.
 * 디스크에 저장해 서버 Cache-Control 과 상관없이 다시 받지 않고,
 * 메모리에도 올려 바로 그린다. 미리 받기(prefetchImages)도 같은 정책을 쓴다
 */
export const IMAGE_CACHE_POLICY = 'memory-disk';

// 사진을 누르기 전에 원본을 미리 받아 expo-image 캐시에 넣어 둔다. 실패해도 뷰어가 다시 받으므로 무시
export const prefetchImages = uris => {
  const validUris = (Array.isArray(uris) ? uris : [uris]).filter(
    uri => typeof uri === 'string' && uri.length > 0,
  );
  if (validUris.length === 0) return;

  ExpoImage.prefetch(validUris, { cachePolicy: IMAGE_CACHE_POLICY }).catch(() => {});
};

export const isImageFile = file => {
  const mimeType = file?.mimeType?.toLowerCase();
  const fileType = file?.fileType?.toLowerCase();

  return mimeType?.startsWith('image/') || fileType === 'image';
};

export const getImageSources = (files, limit = 2) =>
  (Array.isArray(files) ? files : [])
    .filter(isImageFile)
    .map(file => resolveMediaUri(file?.url))
    .filter(Boolean)
    .slice(0, limit)
    .map(uri => ({ uri }));

// 이미지 목록의 React key (uri가 없으면 순서로 구분)
export const getImageKey = (imageSource, index) => {
  if (typeof imageSource === 'string') return `${imageSource}-${index}`;
  if (imageSource && typeof imageSource === 'object' && imageSource.uri) return `${imageSource.uri}-${index}`;

  return `image-${index}`;
};
