import { login } from '@react-native-kakao/user';
import { Platform } from 'react-native';

import apiClient from '../../../shared/api/client';
import useSocialLogin from './useSocialLogin';

// 카카오 로그인 창을 닫거나 동의 화면에서 취소했을 때 SDK 가 주는 code
const KAKAO_CANCEL_CODES = ['Cancelled', 'AccessDenied'];

const isKakaoLoginCancelled = error =>
  KAKAO_CANCEL_CODES.includes(error?.code);

// 카카오계정 로그인으로 직접 계정을 고르게 한다.
// 안드로이드는 계정 선택 화면, iOS 는 라이브러리가 SelectAccount 를 지원하지 않아
// 매번 아이디/비밀번호를 입력하는 로그인 화면을 띄운다.
const KAKAO_LOGIN_OPTIONS = {
  useKakaoAccountLogin: true,
  prompts: Platform.OS === 'android' ? ['SelectAccount'] : ['Login'],
};

// 받은 카카오 access token 을 서버가 직접 확인한다. POST /auth/kakao
const loginWithKakao = async () => {
  const { accessToken } = await login(KAKAO_LOGIN_OPTIONS);

  const response = await apiClient.post('/auth/kakao', { accessToken });

  return response.data;
};

/**
 * 카카오 로그인. 흐름은 useSocialLogin
 */
const useKakaoLogin = ({ onNewUser, onError } = {}) => {
  const { login: startLogin, isLoggingIn } = useSocialLogin({
    login: loginWithKakao,
    isCancelled: isKakaoLoginCancelled,
    providerLabel: '카카오',
    onNewUser,
    onError,
  });

  return {
    loginWithKakao: startLogin,
    isLoggingIn,
  };
};

export default useKakaoLogin;
