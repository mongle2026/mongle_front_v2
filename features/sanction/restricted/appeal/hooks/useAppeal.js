import { useMutation } from '@tanstack/react-query';

import apiClient, { getApiErrorDetail } from '../../../../../shared/api/client';

/**
 * 이용 제한 이의 신청. POST /appeal { content }
 *
 * 응답: { appealStatus, isAlreadyAppealed }
 * 이 제한에 이미 이의 신청했으면 서버는 다시 저장하지 않고 그 신청의 상태를 돌려준다.
 * 이용 제한 중에도 부를 수 있는 API 다.
 */
const useAppeal = ({ onSuccess, onError } = {}) => {
  const mutation = useMutation({
    mutationFn: async ({ content }) => {
      const response = await apiClient.post('/appeal', { content });

      return response.data;
    },

    onSuccess: data => {
      onSuccess?.(data);
    },

    onError: error => {
      console.warn('이의 신청하지 못했습니다.', getApiErrorDetail(error));

      onError?.(error);
    },
  });

  return {
    appeal: mutation.mutate,
    isAppealing: mutation.isPending,
  };
};

export default useAppeal;
