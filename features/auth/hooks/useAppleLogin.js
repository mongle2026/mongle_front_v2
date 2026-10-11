import * as AppleAuthentication from 'expo-apple-authentication';

import apiClient from '../../../shared/api/client';
import useSocialLogin from './useSocialLogin';

// 애플 로그인 창을 닫았을 때 주는 code
const APPLE_CANCEL_CODE = 'ERR_REQUEST_CANCELED';

const isAppleLoginCancelled = error => error?.code === APPLE_CANCEL_CODE;

// 닉네임은 가입 화면에서 직접 정하므로 이름 · 이메일은 요청하지 않는다.
// 받은 identity token(JWT)을 서버가 애플 공개키로 확인한다. POST /auth/apple
const loginWithApple = async () => {
  const { identityToken } = await AppleAuthentication.signInAsync();

  if (!identityToken) {
    throw new Error('애플 인증 정보를 받지 못했습니다.');
  }

  const response = await apiClient.post('/auth/apple', { identityToken });

  return response.data;
};

/**
 * 애플 로그인 (iOS 전용). 흐름은 useSocialLogin
 */
const useAppleLogin = ({ onNewUser, onError } = {}) => {
  const { login: startLogin, isLoggingIn } = useSocialLogin({
    login: loginWithApple,
    isCancelled: isAppleLoginCancelled,
    providerLabel: '애플',
    onNewUser,
    onError,
  });

  return {
    loginWithApple: startLogin,
    isLoggingIn,
  };
};

export default useAppleLogin;
