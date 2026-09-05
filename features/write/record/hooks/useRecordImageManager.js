import { useCallback } from 'react';
import { Keyboard } from 'react-native';

import { useGlobalOverlay } from '../../../../shared/providers/GlobalOverlayProvider';
import { useFloatingBottomOffset } from '../../../../shared/hooks/useFloatingBottomOffset';
import { useRecordFormStore } from '../../store/useRecordFormStore';
import { usePickImages } from './usePickImages';

const MAX_IMAGES = 2;

/*
 * RecordScreen / RecordEditScreen에서 공통으로 사용하는
 * 이미지 선택, 삭제 및 되돌리기 로직입니다.
 */
export const useRecordImageManager = () => {
  const files = useRecordFormStore(state => state.files);
  const removeFile = useRecordFormStore(state => state.removeFile);
  const restoreFile = useRecordFormStore(state => state.restoreFile);

  const imageFiles = files.filter(file => file.fileType === 'IMAGE');
  const isImageLimitReached = imageFiles.length >= MAX_IMAGES;

  const pickImages = usePickImages();
  const bottomOffset = useFloatingBottomOffset();
  const { showToast } = useGlobalOverlay();

  const handlePressImage = useCallback(() => {
    Keyboard.dismiss();
    pickImages();
  }, [pickImages]);

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
