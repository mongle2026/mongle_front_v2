import { useCallback, useMemo } from 'react';
import { Keyboard } from 'react-native';

import { useGlobalOverlay } from '../../../../shared/providers/GlobalOverlayProvider';
import { useFloatingBottomOffset } from '../../../../shared/hooks/useFloatingBottomOffset';
import { useRecordFormStore } from '../../store/useRecordFormStore';
import { MAX_IMAGES, usePickImages } from './usePickImages';

/*
 * RecordScreen / RecordEditScreen에서 공통으로 사용하는
 * 이미지 선택, 삭제 및 되돌리기 로직입니다.
 */
export const useRecordImageManager = () => {
  const files = useRecordFormStore(state => state.files);
  const removeFile = useRecordFormStore(state => state.removeFile);
  const restoreFile = useRecordFormStore(state => state.restoreFile);

  // 매번 새 배열을 만들면 SelectedImageList(memo)가 화면이 그려질 때마다 같이 다시 그려진다
  const imageFiles = useMemo(
    () => files.filter(file => file.fileType === 'IMAGE'),
    [files],
  );
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
