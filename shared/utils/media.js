const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');
const ABSOLUTE_URI_PATTERN = /^(https?:\/\/|file:\/\/|content:\/\/|data:)/i;

export const resolveMediaUri = uri => {
  if (typeof uri !== 'string') return null;

  const normalizedUri = uri.trim();
  if (!normalizedUri) return null;
  if (ABSOLUTE_URI_PATTERN.test(normalizedUri)) return normalizedUri;
  if (!API_BASE_URL) return null;

  return `${API_BASE_URL}${normalizedUri.startsWith('/') ? '' : '/'}${normalizedUri}`;
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