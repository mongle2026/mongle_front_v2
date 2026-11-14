import { useMutation, useQueryClient } from '@tanstack/react-query';

import apiClient, { getApiErrorDetail } from '../../../shared/api/client';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import { syncReportedFeed } from '../../feed/api/feedCache';

import { REPORT_TARGET_TYPE } from '../constants';

/**
 * 신고 요청. POST /report/{type}/{targetId}
 *
 * type: REPORT_TARGET_TYPE (feed | comment | letter | user)
 * targetId: 피드 · 댓글 · 편지는 id, 사용자는 publicId
 * reason: REPORT_REASON
 * detail: 기타 사유. 없으면 보내지 않는다
 *
 * 이미 신고한 대상을 다시 신고해도 서버는 성공으로 응답한다.
 * 피드는 신고한 뒤 그 피드를 다시 받아, 운영자가 바로 가렸으면 홈에서 가림 카드로 보여준다.
 * 다시 받는 동안에도 신고 중(isReporting)으로 두어서 돌아간 화면에 바로 반영되게 한다
 */
const useReport = ({ onSuccess, onError } = {}) => {
  const queryClient = useQueryClient();
  const { userId } = useCurrentUser();

  const mutation = useMutation({
    mutationFn: async ({ type, targetId, reason, detail }) => {
      const body = { reason };

      if (detail) body.detail = detail;

      const response = await apiClient.post(
        `/report/${type}/${encodeURIComponent(targetId)}`,
        body,
      );

      if (type === REPORT_TARGET_TYPE.FEED) {
        await syncReportedFeed(queryClient, { userId, feedId: targetId });
      }

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
