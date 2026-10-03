import apiClient, { getApiErrorDetail } from '../../../../shared/api/client';
import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import {
  useRecordFormStore,
} from '../../store/useRecordFormStore';

import {
  prepareRecordSubmission,
} from '../../utils/recordSubmission';

import {
  feedDetailKeys,
  feedHomeKeys,
} from '../../../feed/api/feedCache';
import { archiveKeys } from '../../../archive/api/archiveKeys';

const useUpdateFeed = ({
  feedId,
  userId,
  originalFileIds = [],
  onSuccess,
  onError,
} = {}) => {
  const queryClient = useQueryClient();

  const resetRecordForm =
    useRecordFormStore(
      state => state.resetRecordForm,
    );

  const mutation = useMutation({
    mutationFn: async () => {
      if (!feedId) {
        throw new Error(
          '수정할 피드 정보가 없습니다.',
        );
      }

      const { recordForm, recordBody } =
        await prepareRecordSubmission({ userId });

      /*
       * 처음 불러온 서버 파일 중
       * 지금 store에 남아 있지 않은 파일만
       * 삭제 대상으로 계산합니다.
       */
      const remainingServerFileIds =
        recordForm.files
          .filter(file => file.isRemote)
          .map(file => file.serverFileId);

      const deleteFileIds =
        originalFileIds.filter(
          id => !remainingServerFileIds.includes(id),
        );

      const response =
        await apiClient.patch(
          `/feed/${feedId}`,
          {
            ...recordBody,
            visibility: recordForm.visibility ?? 'PUBLIC',
            deleteFileIds,
          },
          {
            params: {
              userId: String(userId),
            },
          },
        );

      return response.data;
    },

    onSuccess: data => {
      /*
       * 피드 홈, 상세 화면, 보관함에 수정 내용이 반영되게 합니다.
       */
      queryClient.invalidateQueries({
        queryKey: feedHomeKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: archiveKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey:
          feedDetailKeys.detail(
            userId,
            feedId,
          ),
      });

      /*
       * 서버 저장에 성공한 경우에만
       * 작성 상태를 초기화합니다.
       */
      resetRecordForm();

      onSuccess?.(data);
    },

    onError: error => {
      console.warn(
        '피드 수정에 실패했습니다.',
        getApiErrorDetail(error),
      );

      onError?.(error);
    },
  });

  return {
    updateFeed: mutation.mutate,
    isUpdatingFeed:
      mutation.isPending,
  };
};

export default useUpdateFeed;
