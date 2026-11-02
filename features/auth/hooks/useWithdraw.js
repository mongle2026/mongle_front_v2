import * as AppleAuthentication from 'expo-apple-authentication';
import { useMutation } from '@tanstack/react-query';

import apiClient, { getApiErrorDetail } from '../../../shared/api/client';
import { useAuthStore } from '../../../shared/auth/useAuthStore';

// 애플 로그인 창을 닫았을 때 주는 code
const APPLE_CANCEL_CODE = 'ERR_REQUEST_CANCELED';

const isAppleLoginCancelled = error => error?.code === APPLE_CANCEL_CODE;

// 서버가 애플 계정 연결을 끊으려면 탈퇴 직전에 받은 authorization code 가 필요하다.
// 발급 후 5분 안에 한 번만 쓸 수 있어서 탈퇴할 때마다 애플 로그인을 한 번 더 한다
const getAppleAuthorizationCode = async () => {
  const { authorizationCode } = await AppleAuthentication.signInAsync();

  if (!authorizationCode) {
    throw new Error('애플 인증 정보를 받지 못했습니다.');
  }

  return authorizationCode;
};

// DELETE /auth/me. 카카오 회원은 서버가 직접 연결을 끊어서 보낼 값이 없다
const withdraw = async ({ provider }) => {
  const authorizationCode =
    provider === 'APPLE' ? await getAppleAuthorizationCode() : undefined;

  const response = await apiClient.delete('/auth/me', {
    data: { authorizationCode },
  });

  return response.data;
};

/**
 * 회원 탈퇴. 서버가 푸시 토큰 · refresh token 까지 지우므로 성공하면 앱의 로그인 정보만 지운다.
 * withdraw({ provider }): useCurrentUser 의 provider ('KAKAO' | 'APPLE')
 * onSuccess: 로그아웃되기 전에 할 일 (화면 이동 등)
 * 애플 로그인 창을 닫으면 탈퇴하지 않고 onError 도 부르지 않는다
 */
const useWithdraw = ({ onSuccess, onError } = {}) => {
  const signOut = useAuthStore(state => state.signOut);

  const mutation = useMutation({
    mutationFn: withdraw,

    onSuccess: async () => {
      onSuccess?.();
      await signOut();
    },

    onError: error => {
      if (isAppleLoginCancelled(error)) return;

      console.warn('회원 탈퇴에 실패했습니다.', getApiErrorDetail(error));

      onError?.(error);
    },
  });

  return {
    withdraw: mutation.mutate,
    isWithdrawing: mutation.isPending,
  };
};

export default useWithdraw;
