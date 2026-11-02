import { useCallback, useEffect, useRef, useState } from 'react';
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
 * 프로필 사진. 사진 보관함이나 파일 앱에서 한 장을 골라 저장한다. 회원가입과 프로필 정보 편집에서 함께 쓴다.
 *
 * 고르자마자 업로드를 시작해서, 아이디 · 닉네임을 입력하는 동안 끝나게 한다.
 * 기본 사진은 서버에 회원마다 번호로 정해져 있고 파일은 모두 함께 써서, 올리지 않는다.
 * 가입 전에는 로그인 토큰이 없어서 signupToken 으로 업로드 URL 을 받는다. 없으면 로그인 토큰으로 받는다.
 *
 * initialProfileImgUri: 지금 쓰고 있는 사진 주소(기본 사진이면 기본 사진 주소). 없으면 defaultProfileImg 에서 시작한다
 * defaultProfileImg: 기본 사진 ({ uri }). 가입은 서버 목록에서 고른 사진, 편집은 내 기본 사진 주소.
 *                    한 번 정하면 바꾸지 않는다. 없으면 사진 없이(null) 두고, 나중에 받으면 그때 채운다
 *
 * profileImg: 보여줄 사진 ({ uri, name, type, width, height }). 처음 사진 · 기본 사진은 { uri } 만 있고, 사진이 없으면 null
 * isProfileImgChanged: 처음과 다른 사진이면 true. 다른 사진을 골랐다가 처음 사진(기본 사진)으로 돌아오면 false
 * pickProfileImgFromLibrary: 권한을 받은 뒤 사진 보관함을 연다. 권한이 없거나 취소하면 그대로 둔다
 * pickProfileImgFromFile: 파일 앱을 연다. 시스템 파일 선택기라 권한은 받지 않는다. 취소하면 그대로 둔다
 * deleteProfileImg: 사진을 지워서 defaultProfileImg 로 되돌린다
 * getProfileImgKey: 새로 고른 사진의 업로드가 끝나기를 기다려 key를 돌려준다. 기본 사진을 쓰고 있으면 null.
 *                   미리 올리다 실패했으면 한 번 더 올려 보고, 그래도 실패하면 ProfileImgUploadError
 */
const useProfileImgPicker = ({ signupToken, initialProfileImgUri, defaultProfileImg } = {}) => {
  const [profileImg, setProfileImg] = useState(() =>
    initialProfileImgUri ? { uri: initialProfileImgUri } : defaultProfileImg ?? null,
  );
  const uploadTaskRef = useRef(null);

  const isProfileImgChanged = (profileImg?.uri ?? null) !== (initialProfileImgUri ?? null);

  // 가입 화면은 기본 사진 목록을 서버에서 받아서 늦게 올 수 있다. 그 사이 사진을 골랐으면 그대로 둔다
  useEffect(() => {
    if (!defaultProfileImg) return;

    setProfileImg(prev => prev ?? defaultProfileImg);
  }, [defaultProfileImg]);

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
      // Android 사진 선택기에 '찾아보기' 메뉴를 띄운다
      legacy: true,
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
    setProfileImg(defaultProfileImg ?? null);
    uploadTaskRef.current = null;
  }, [defaultProfileImg]);

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
    isProfileImgChanged,
    pickProfileImgFromLibrary,
    pickProfileImgFromFile,
    deleteProfileImg,
    getProfileImgKey,
  };
};

export default useProfileImgPicker;
