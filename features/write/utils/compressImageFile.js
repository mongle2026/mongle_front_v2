import {
  manipulateAsync,
  SaveFormat,
} from 'expo-image-manipulator';

const MAX_DIMENSION = 1920;
const COMPRESS_QUALITY = 0.7;

const isImageFile = file =>
  file?.fileType === 'IMAGE' ||
  (file?.mimeType ?? file?.type ?? '')
    .startsWith('image/');

/**
 * 로컬에서 새로 선택된 이미지 파일을
 * 업로드 직전에 JPG로 압축합니다.
 *
 * 이미지가 아니거나 서버에 이미 저장된 파일(isRemote)은
 * 그대로 반환합니다.
 */
export const compressImageFile = async file => {
  if (!isImageFile(file) || file.isRemote) {
    return file;
  }

  const actions = [];

  if (
    file.width > MAX_DIMENSION ||
    file.height > MAX_DIMENSION
  ) {
    const isLandscape =
      file.width >= file.height;

    actions.push({
      resize: isLandscape
        ? { width: MAX_DIMENSION }
        : { height: MAX_DIMENSION },
    });
  }

  const result = await manipulateAsync(
    file.uri,
    actions,
    {
      compress: COMPRESS_QUALITY,
      format: SaveFormat.JPEG,
    },
  );

  return {
    ...file,
    uri: result.uri,
    width: result.width,
    height: result.height,
    type: 'image/jpeg',
    mimeType: 'image/jpeg',

    name:
      (file.name ?? file.originalName)
        ?.replace(/\.[^./\\]+$/, '.jpg') ??
      `image-${Date.now()}.jpg`,
  };
};
