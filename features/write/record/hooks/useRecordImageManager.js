import { useCallback, useMemo } from 'react';
import { Keyboard } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { useGlobalOverlay } from '../../../../shared/providers/GlobalOverlayProvider';
import { useFloatingBottomOffset } from '../../../../shared/hooks/useFloatingBottomOffset';
import { useRecordFormStore } from '../../store/useRecordFormStore';

// 기록 / 편지 한 건에 첨부할 수 있는 최대 이미지 수
export const MAX_IMAGES = 2;

/*
 * 사진 라이브러리에서 remainingCount 장까지 고른 뒤
 * store에 저장할 파일 구조로 변환합니다.
 * 권한이 없거나 사용자가 취소하면 빈 배열을 돌려줍니다.
 */
const pickImagesFromLibrary = async remainingCount => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissionResult.granted) {
    alert('사진 접근 권한이 필요합니다.');
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsMultipleSelection: true,
    selectionLimit: remainingCount,
    quality: 0.8,
  });

  if (result.canceled) return [];

  return result.assets.map((asset, index) => ({
    uri: asset.uri,

    name: asset.fileName ?? `image-${Date.now()}-${index}.jpg`,

    type: asset.mimeType ?? 'image/jpeg',

    fileType: 'IMAGE',

    width: asset.width,
    height: asset.height,
  }));
};

/*
 * RecordScreen / RecordEditScreen에서 공통으로 사용하는
 * 이미지 선택, 삭제 및 되돌리기 로직입니다.
 */
export const useRecordImageManager = () => {
  const files = useRecordFormStore(state => state.files);
  const setFiles = useRecordFormStore(state => state.setFiles);
  const removeFile = useRecordFormStore(state => state.removeFile);
  const restoreFile = useRecordFormStore(state => state.restoreFile);

  // 매번 새 배열을 만들면 SelectedImageList(memo)가 화면이 그려질 때마다 같이 다시 그려진다
  const imageFiles = useMemo(
    () => files.filter(file => file.fileType === 'IMAGE'),
    [files],
  );
  const isImageLimitReached = imageFiles.length >= MAX_IMAGES;

  const bottomOffset = useFloatingBottomOffset();
  const { showToast } = useGlobalOverlay();

  const handlePressImage = useCallback(async () => {
    Keyboard.dismiss();

    const remainingCount = MAX_IMAGES - imageFiles.length;

    if (remainingCount <= 0) {
      alert('이미지는 최대 2장까지 첨부할 수 있습니다.');
      return;
    }

    try {
      const selectedImages = await pickImagesFromLibrary(remainingCount);
      if (!selectedImages.length) return;

      const otherFiles = files.filter(file => file.fileType !== 'IMAGE');

      setFiles([...otherFiles, ...imageFiles, ...selectedImages]);
    } catch (error) {
      console.log('pickImages error:', error);
    }
  }, [files, imageFiles, setFiles]);

  const handleRemoveImage = useCallback(
    image => {
      if (!image?.uri) return;

      const fileIndex = files.findIndex(file => file.uri === image.uri);
      if (fileIndex < 0) return;

      removeFile(image.uri);

      showToast({
        message: '사진을 삭제했습니다.',
        buttonText: '되돌리기',
        onPressButton: () => restoreFile(image, fileIndex),
        bottomOffset,
      });
    },
    [bottomOffset, files, removeFile, restoreFile, showToast],
  );

  return {
    imageFiles,
    isImageLimitReached,
    handlePressImage,
    handleRemoveImage,
  };
};
