import { useMutation } from '@tanstack/react-query';

import { getApiErrorDetail } from '../../../shared/api/client';
import { useAuthStore } from '../../../shared/auth/useAuthStore';

/**
 * 카카오 · 애플 로그인 공통 흐름.
 * login: 소셜 SDK 로 로그인하고 서버 응답을 돌려준다
 *        { isNewUser: false, accessToken, refreshToken, user } | { isNewUser: true, signupToken, suggestedNickname }
 * isCancelled: 사용자가 로그인을 취소한 에러인지. 취소는 onError 를 부르지 않는다
 *
 * - 가입된 계정이면 로그인 상태를 저장한다. 화면은 App 의 RootNavigator 가 메인으로 바꾼다
 * - 처음이면 onNewUser({ signupToken, suggestedNickname }) 로 가입 화면에 넘길 값을 준다
 */
const useSocialLogin = ({ login, isCancelled, providerLabel, onNewUser, onError }) => {
  const signIn = useAuthStore(state => state.signIn);

  const mutation = useMutation({
    mutationFn: login,

    onSuccess: async data => {
      if (data.isNewUser) {
        onNewUser?.({
          signupToken: data.signupToken,
          suggestedNickname: data.suggestedNickname,
        });
        return;
      }

      await signIn(data);
    },

    onError: error => {
      if (isCancelled(error)) return;

      console.warn(`${providerLabel} 로그인에 실패했습니다.`, getApiErrorDetail(error));

      onError?.(error);
    },
  });

  return {
    login: mutation.mutate,
    isLoggingIn: mutation.isPending,
  };
};

export default useSocialLogin;
