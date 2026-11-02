import { useMutation, useQueryClient } from '@tanstack/react-query';

import apiClient, { getApiErrorDetail } from '../../../../shared/api/client';

import { profileKeys } from '../../api/profileKeys';

/**
 * 프로필 게시글 편집 저장. PATCH /feed/me/profile
 *
 * showFeedIds: 프로필에 다시 보이게 할 글 / hideFeedIds: 프로필에서 뺄 글 (바꾼 글만)
 *
 * 성공하면 프로필 그리드·편집 목록을 다시 불러온 뒤 onSuccess 를 부른다.
 * 다시 불러오기를 기다려서, 돌아간 프로필 화면에 바뀐 그리드가 바로 보이게 한다
 */
const useUpdateProfileFeeds = ({ userId, onSuccess, onError } = {}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ showFeedIds, hideFeedIds }) => {
      const response = await apiClient.patch('/feed/me/profile', {
        showFeedIds: showFeedIds.map(Number),
        hideFeedIds: hideFeedIds.map(Number),
      });

      return response.data;
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.covers(userId) });

      onSuccess?.();
    },

    onError: error => {
      console.warn('프로필 게시글을 저장하지 못했습니다.', getApiErrorDetail(error));

      onError?.(error);
    },
  });

  return {
    updateProfileFeeds: mutation.mutate,
    isUpdatingProfileFeeds: mutation.isPending,
  };
};

export default useUpdateProfileFeeds;
