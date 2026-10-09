import { useMutation } from '@tanstack/react-query';

import apiClient, { getApiErrorDetail } from '../../../shared/api/client';

// TODO: 카카오/애플 로그인을 붙이면 로그인 응답의 signupToken 을 받아서 쓴다.
// 지금은 백엔드가 임의의 카카오 계정으로 발급한 signupToken 을 쓴다
const fetchMockSignupToken = async () => {
  const response = await apiClient.post('/auth/mock/kakao');

  return response.data.signupToken;
};

/**
 * 회원가입 요청.
 * 프로필 사진이 있으면 업로드가 끝나기를 기다렸다가 key를 함께 보낸다.
 * 성공하면 { accessToken, refreshToken, user } 를 onSuccess 로 넘긴다.
 */
const useSignup = ({ onSuccess, onError } = {}) => {
  const mutation = useMutation({
    mutationFn: async ({ userCode, nickname, getProfileImgKey }) => {
      const profileImageKey = await getProfileImgKey?.();
      const signupToken = await fetchMockSignupToken();

      const response = await apiClient.post('/auth/signup', {
        signupToken,
        userCode,
        nickname,
        ...(profileImageKey ? { profileImageKey } : {}),
      });

      return response.data;
    },

    onSuccess: data => {
      onSuccess?.(data);
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
