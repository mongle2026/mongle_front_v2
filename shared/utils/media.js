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

export const isImageFile = file => {
  const mimeType = file?.mimeType?.toLowerCase();
  const fileType = file?.fileType?.toLowerCase();

  return mimeType?.startsWith('image/') || fileType === 'image';
};

export const hasImageFiles = files =>
  Array.isArray(files) && files.some(isImageFile);

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
