import { useMutation, useQueryClient } from '@tanstack/react-query';

import apiClient, { getApiErrorDetail } from '../../../../shared/api/client';

/**
 * 프로필 정보 수정 요청. 넘긴 항목만 보낸다.
 *
 * userCode / nickname: 바꾼 값. 바꾸지 않았으면 넘기지 않는다
 * getProfileImgKey: 사진을 바꿨을 때만 넘긴다. 새 사진의 key를 돌려주면 그 사진으로, null 이면 사진을 지운다
 *
 * 성공하면 내 정보(current-user)를 다시 불러온 뒤 onSuccess 를 부른다.
 * 다시 불러오기를 기다려서, 돌아간 프로필 화면에 바뀐 정보가 바로 보이게 한다
 */
const useUpdateProfile = ({ onSuccess, onError } = {}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ userCode, nickname, getProfileImgKey }) => {
      const body = {};

      if (userCode !== undefined) body.userCode = userCode;
      if (nickname !== undefined) body.nickname = nickname;
      if (getProfileImgKey) body.profileImageKey = await getProfileImgKey();

      const response = await apiClient.patch('/user/me', body);

      return response.data;
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });

      onSuccess?.();
    },

    onError: error => {
      console.warn('프로필을 수정하지 못했습니다.', getApiErrorDetail(error));

      onError?.(error);
    },
  });

  return {
    updateProfile: mutation.mutate,
    isUpdatingProfile: mutation.isPending,
  };
};

export default useUpdateProfile;
