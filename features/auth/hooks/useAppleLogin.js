import * as AppleAuthentication from 'expo-apple-authentication';

import apiClient from '../../../shared/api/client';
import useSocialLogin from './useSocialLogin';

// 애플 로그인 창을 닫았을 때 주는 code
const APPLE_CANCEL_CODE = 'ERR_REQUEST_CANCELED';

const isAppleLoginCancelled = error => error?.code === APPLE_CANCEL_CODE;

// 닉네임은 가입 화면에서 직접 정하므로 이름은 요청하지 않는다.
// 이메일은 identity token 에 담겨 오고, 서버가 토큰을 확인하면서 꺼내 가입할 때 저장한다.
// 받은 identity token(JWT)을 서버가 애플 공개키로 확인한다. POST /auth/apple
// authorization code 는 서버가 애플 refresh token 으로 바꿔 두고, 탈퇴할 때(운영자가 탈퇴시킬 때 포함) 애플 연결을 끊는 데 쓴다.
// 발급 후 5분 안에 한 번만 쓸 수 있어서 받은 즉시 함께 보낸다. 못 받아도 로그인은 그대로 한다
const loginWithApple = async () => {
  const { identityToken, authorizationCode } =
    await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
    });

  if (!identityToken) {
    throw new Error('애플 인증 정보를 받지 못했습니다.');
  }

  const response = await apiClient.post('/auth/apple', {
    identityToken,
    authorizationCode: authorizationCode ?? undefined,
  });

  return response.data;
};

/**
 * 애플 로그인 (iOS 전용). 흐름은 useSocialLogin
 */
const useAppleLogin = ({ onNewUser, onBeforeSignIn, onError } = {}) => {
  const { login: startLogin, isLoggingIn } = useSocialLogin({
    login: loginWithApple,
    isCancelled: isAppleLoginCancelled,
    providerLabel: '애플',
    onNewUser,
    onBeforeSignIn,
    onError,
  });

  return {
    loginWithApple: startLogin,
    isLoggingIn,
  };
};

export default useAppleLogin;
