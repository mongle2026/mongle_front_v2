import axios from 'axios';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import apiClient from '../../../shared/api/client';

// 프로필 사진은 크게 보여도 104px라서 짧은 쪽 512px이면 충분하다
const PROFILE_IMG_MAX_DIMENSION = 512;
const COMPRESS_QUALITY = 0.8;

// 사진 업로드에서 난 에러. 가입 요청의 에러와 구분해서 안내한다
export class ProfileImgUploadError extends Error {
  constructor(cause) {
    super('프로필 사진을 올리지 못했습니다.');
    this.name = 'ProfileImgUploadError';
    this.cause = cause;
  }
}

// 서버는 jpg만 받으므로 png · heic도 jpg로 바꾼다
const compressProfileImg = async ({ uri, width, height }) => {
  const actions = [];

  if (Math.min(width ?? 0, height ?? 0) > PROFILE_IMG_MAX_DIMENSION) {
    actions.push({
      resize: width <= height
        ? { width: PROFILE_IMG_MAX_DIMENSION }
        : { height: PROFILE_IMG_MAX_DIMENSION },
    });
  }

  const result = await manipulateAsync(uri, actions, {
    compress: COMPRESS_QUALITY,
    format: SaveFormat.JPEG,
  });

  return result.uri;
};

/**
 * 프로필 사진을 jpg로 압축하고 presigned URL로 R2에 올린다.
 * 돌려받은 key를 가입 요청이나 프로필 수정 요청에 실어 보낸다.
 *
 * signupToken: 가입 전에는 로그인 토큰이 없어서 이 토큰으로 업로드 URL 을 받는다. 없으면 로그인 토큰을 쓴다
 *
 * 저장하지 않고 나가서 쓰이지 않은 사진은 서버 크론이 지운다.
 */
const uploadProfileImg = async (profileImg, signupToken) => {
  try {
    const uri = await compressProfileImg(profileImg);

    const { data: upload } = await apiClient.post(
      '/user/profile-image/upload-url',
      null,
      signupToken
        ? {
          headers: { Authorization: `Bearer ${signupToken}` },
          // 로그인 토큰이 아니라서 401 이어도 refresh 하지 않는다
          skipAuthRefresh: true,
        }
        : undefined,
    );

    const fileResponse = await fetch(uri);
    const fileBlob = await fileResponse.blob();

    await axios.put(upload.uploadUrl, fileBlob, {
      headers: { 'Content-Type': upload.mimeType },
      transformRequest: [data => data],
    });

    return upload.key;
  } catch (error) {
    throw new ProfileImgUploadError(error);
  }
};

export default uploadProfileImg;
