import { login } from '@react-native-kakao/user';

import apiClient from '../../../shared/api/client';
import useSocialLogin from './useSocialLogin';

// 카카오 로그인 창을 닫거나 동의 화면에서 취소했을 때 SDK 가 주는 code
const KAKAO_CANCEL_CODES = ['Cancelled', 'AccessDenied'];

const isKakaoLoginCancelled = error =>
  KAKAO_CANCEL_CODES.includes(error?.code);

// 카카오톡이 있으면 카카오톡으로, 없으면 카카오계정으로 로그인한다.
// 받은 카카오 access token 을 서버가 직접 확인한다. POST /auth/kakao
const loginWithKakao = async () => {
  const { accessToken } = await login();

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
