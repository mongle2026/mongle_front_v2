import { useMutation } from '@tanstack/react-query';

import apiClient, { getApiErrorDetail } from '../../../shared/api/client';
import { useAuthStore } from '../../../shared/auth/useAuthStore';

/**
 * 회원가입 요청.
 * signupToken: 카카오/애플 로그인에서 신규 유저로 받은 토큰. 어떤 소셜 계정으로 가입하는지 서버가 확인한다
 * isMarketingAgreed: 약관 화면의 광고성 정보 수신 동의. 서버가 이벤트 알림 설정으로 저장한다
 * 프로필 사진이 있으면 업로드가 끝나기를 기다렸다가 key를 함께 보낸다.
 * 성공하면 onSuccess(가입 완료 화면으로 이동)를 먼저 부르고 로그인 상태를 저장한다.
 * 로그인되면 App 의 RootNavigator 가 Welcome · 약관 · 가입 화면을 뺀다
 */
const useSignup = ({ signupToken, isMarketingAgreed = false, onSuccess, onError } = {}) => {
  const signIn = useAuthStore(state => state.signIn);

  const mutation = useMutation({
    mutationFn: async ({ userCode, nickname, getProfileImgKey }) => {
      const profileImageKey = await getProfileImgKey?.();

      const response = await apiClient.post('/auth/signup', {
        signupToken,
        userCode,
        nickname,
        isMarketingAgreed,
        ...(profileImageKey ? { profileImageKey } : {}),
      });

      return response.data;
    },

    // 로그인하면 가입 화면이 빠지므로, 그 전에 가입 완료 화면을 띄운다
    onSuccess: (data, variables) => {
      onSuccess?.(data, variables);

      return signIn(data);
    },

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
