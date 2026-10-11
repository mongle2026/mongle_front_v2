import { useCallback, useRef, useState } from 'react';
import { Image } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import uploadProfileImg from '../utils/uploadProfileImg';

// 업로드 실패를 기다리는 곳이 없어도 경고가 뜨지 않게 하고, 나중에 await하면 그대로 실패를 받는다
const startUpload = (profileImg, signupToken) => {
  const promise = uploadProfileImg(profileImg, signupToken);
  promise.catch(() => {});

  return { profileImg, promise };
};

// 파일 앱은 사진 크기를 알려주지 않아서 직접 읽는다. 못 읽으면 줄이지 않고 그대로 올린다
const getImgSize = uri => new Promise(resolve => {
  Image.getSize(
    uri,
    (width, height) => resolve({ width, height }),
    () => resolve({ width: undefined, height: undefined }),
  );
});

/**
 * 회원가입 프로필 사진. 사진 보관함이나 파일 앱에서 한 장을 골라 저장한다.
 *
 * 고르자마자 업로드를 시작해서, 아이디 · 닉네임을 입력하는 동안 끝나게 한다.
 * 가입 전이라 로그인 토큰 대신 signupToken 으로 업로드 URL 을 받는다.
 *
 * profileImg: 고른 사진 ({ uri, name, type, width, height }), 고르기 전에는 null
 * pickProfileImgFromLibrary: 권한을 받은 뒤 사진 보관함을 연다. 권한이 없거나 취소하면 그대로 둔다
 * pickProfileImgFromFile: 파일 앱을 연다. 시스템 파일 선택기라 권한은 받지 않는다. 취소하면 그대로 둔다
 * deleteProfileImg: 고른 사진을 지워서 기본 프로필 사진으로 되돌린다
 * getProfileImgKey: 업로드가 끝나기를 기다려 key를 돌려준다. 사진이 없으면 null.
 *                   미리 올리다 실패했으면 한 번 더 올려 보고, 그래도 실패하면 ProfileImgUploadError
 */
const useProfileImgPicker = ({ signupToken } = {}) => {
  const [profileImg, setProfileImg] = useState(null);
  const uploadTaskRef = useRef(null);

  const selectProfileImg = useCallback(nextProfileImg => {
    setProfileImg(nextProfileImg);
    uploadTaskRef.current = startUpload(nextProfileImg, signupToken);
  }, [signupToken]);

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

    selectProfileImg({
      uri: asset.uri,
      name: asset.fileName ?? `profile-${Date.now()}.jpg`,
      type: asset.mimeType ?? 'image/jpeg',
      width: asset.width,
      height: asset.height,
    });
  }, [selectProfileImg]);

  const pickProfileImgFromFile = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
    });

    if (result.canceled) return;

    const [asset] = result.assets;
    const { width, height } = await getImgSize(asset.uri);

    selectProfileImg({
      uri: asset.uri,
      name: asset.name ?? `profile-${Date.now()}.jpg`,
      type: asset.mimeType ?? 'image/jpeg',
      width,
      height,
    });
  }, [selectProfileImg]);

  // 이미 올라간 사진은 서버 크론이 지운다
  const deleteProfileImg = useCallback(() => {
    setProfileImg(null);
    uploadTaskRef.current = null;
  }, []);

  const getProfileImgKey = useCallback(async () => {
    const uploadTask = uploadTaskRef.current;

    if (!uploadTask) return null;

    try {
      return await uploadTask.promise;
    } catch {
      const retryTask = startUpload(uploadTask.profileImg, signupToken);
      uploadTaskRef.current = retryTask;

      return retryTask.promise;
    }
  }, [signupToken]);

  return {
    profileImg,
    pickProfileImgFromLibrary,
    pickProfileImgFromFile,
    deleteProfileImg,
    getProfileImgKey,
  };
};

export default useProfileImgPicker;
