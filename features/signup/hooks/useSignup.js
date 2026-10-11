import { useMutation } from '@tanstack/react-query';

import apiClient, { getApiErrorDetail } from '../../../shared/api/client';
import { useAuthStore } from '../../../shared/auth/useAuthStore';

/**
 * 회원가입 요청.
 * signupToken: 카카오/애플 로그인에서 신규 유저로 받은 토큰. 어떤 소셜 계정으로 가입하는지 서버가 확인한다
 * 프로필 사진이 있으면 업로드가 끝나기를 기다렸다가 key를 함께 보낸다.
 * 성공하면 로그인 상태를 저장한다. 화면은 App 의 RootNavigator 가 메인으로 바꾼다
 */
const useSignup = ({ signupToken, onError } = {}) => {
  const signIn = useAuthStore(state => state.signIn);

  const mutation = useMutation({
    mutationFn: async ({ userCode, nickname, getProfileImgKey }) => {
      const profileImageKey = await getProfileImgKey?.();

      const response = await apiClient.post('/auth/signup', {
        signupToken,
        userCode,
        nickname,
        ...(profileImageKey ? { profileImageKey } : {}),
      });

      return response.data;
    },

    onSuccess: data => signIn(data),

    onError: error => {
      console.warn('회원가입에 실패했습니다.', getApiErrorDetail(error));

      onError?.(error);
    },
  });

  return {
    signup: mutation.mutate,
    isSigningUp: mutation.isPending,
  };
};

export default useSignup;
