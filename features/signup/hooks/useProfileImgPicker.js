import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

/**
 * 회원가입 프로필 사진. 사진 보관함에서 한 장을 골라 저장한다.
 *
 * profileImg: 고른 사진 ({ uri, name, type }), 고르기 전에는 null
 * pickProfileImgFromLibrary: 권한을 받은 뒤 사진 보관함을 연다. 권한이 없거나 취소하면 그대로 둔다
 * deleteProfileImg: 고른 사진을 지워서 기본 프로필 사진으로 되돌린다
 */
const useProfileImgPicker = () => {
  const [profileImg, setProfileImg] = useState(null);

  const pickProfileImgFromLibrary = useCallback(async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert('사진 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
    });

    if (result.canceled) return;

    const [asset] = result.assets;

    setProfileImg({
      uri: asset.uri,
      name: asset.fileName ?? `profile-${Date.now()}.jpg`,
      type: asset.mimeType ?? 'image/jpeg',
    });
  }, []);

  const deleteProfileImg = useCallback(() => {
    setProfileImg(null);
  }, []);

  return {
    profileImg,
    pickProfileImgFromLibrary,
    deleteProfileImg,
  };
};

export default useProfileImgPicker;
