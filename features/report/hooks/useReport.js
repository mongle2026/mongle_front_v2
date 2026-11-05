import { useMutation } from '@tanstack/react-query';

import apiClient, { getApiErrorDetail } from '../../../shared/api/client';

/**
 * 신고 요청. POST /report/{type}/{targetId}
 *
 * type: REPORT_TARGET_TYPE (feed | comment | letter | user)
 * targetId: 피드 · 댓글 · 편지는 id, 사용자는 publicId
 * reason: REPORT_REASON
 * detail: 기타 사유. 없으면 보내지 않는다
 *
 * 이미 신고한 대상을 다시 신고해도 서버는 성공으로 응답한다.
 */
const useReport = ({ onSuccess, onError } = {}) => {
  const mutation = useMutation({
    mutationFn: async ({ type, targetId, reason, detail }) => {
      const body = { reason };

      if (detail) body.detail = detail;

      const response = await apiClient.post(
        `/report/${type}/${encodeURIComponent(targetId)}`,
        body,
      );

      return response.data;
    },

    onSuccess: data => {
      onSuccess?.(data);
    },

    onError: error => {
      console.warn('신고하지 못했습니다.', getApiErrorDetail(error));

      onError?.(error);
    },
  });

  return {
    report: mutation.mutate,
    isReporting: mutation.isPending,
  };
};

export default useReport;
