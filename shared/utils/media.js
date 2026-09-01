export const resolveMediaUri = uri => {
  if (typeof uri !== 'string') return null;

  const normalizedUri = uri.trim();
  if (!normalizedUri) return null;

  return normalizedUri;
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