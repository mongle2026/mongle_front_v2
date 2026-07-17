import * as ImagePicker from 'expo-image-picker';
import { useRecordFormStore } from '../store/useRecordFormStore';

const MAX_IMAGES = 2;

export const usePickImages = () => {
  const files = useRecordFormStore(state => state.files);
  const setFiles = useRecordFormStore(state => state.setFiles);

  const pickImages = async () => {
    try {
      const currentImages = files.filter(file => file.fileType === 'IMAGE');

      const remainingCount = MAX_IMAGES - currentImages.length;

      if (remainingCount <= 0) {
        alert('이미지는 최대 2장까지 첨부할 수 있습니다.');
        return;
      }

      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        alert('사진 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsMultipleSelection: true,
        selectionLimit: remainingCount,
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const selectedImages = result.assets.map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName ?? `image-${Date.now()}-${index}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
        fileType: 'IMAGE',
      }));

      const otherFiles = files.filter(file => file.fileType !== 'IMAGE');

      setFiles([...otherFiles, ...currentImages, ...selectedImages]);
    } catch (error) {
      console.log('pickImages error:', error);
    }
  };

  return pickImages;
};