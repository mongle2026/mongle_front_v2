import apiClient, { getApiErrorDetail } from '../../../../shared/api/client';
import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import {
  useRecordFormStore,
} from '../../store/useRecordFormStore';

import {
  prepareRecordFiles,
  uploadRecordFilesAfterSave,
} from '../../utils/uploadRecordFiles';

import {
  feedHomeKeys,
} from '../../../feed/api/feedCache';

const useCreateFeed = ({
  userId,
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
      if (!userId) {
        throw new Error(
          '사용자 정보가 없습니다.',
        );
      }

      /*
       * 저장 버튼을 누른 순간의
       * 최신 form 값을 가져옵니다.
       */
      const recordForm =
        useRecordFormStore.getState();

      /*
       * 압축은 요청 전에 끝내 둡니다.
       * 압축이 실패하면 서버에 아무것도 반영하지 않고 끝납니다.
       */
      const uploadableFiles =
        await prepareRecordFiles(recordForm.files);

      const response =
        await apiClient.post(
          '/feed',
          {
            userId: String(userId),
            music: JSON.stringify(recordForm.music),
            text: recordForm.text ?? '',
            font: recordForm.font ?? 'KYOBO',

            visibility:
              recordForm.visibility ?? 'PUBLIC',
          },
        );

      /*
       * 이미지는 피드 생성 이후
       * presigned URL을 통해 R2에 업로드합니다.
       */
      const fileUploadFailed =
        await uploadRecordFilesAfterSave({
          userId,
          recordId: response.data.recordId,
          files: uploadableFiles,
        });

      return {
        ...response.data,
        fileUploadFailed,
      };
    },

    onSuccess: data => {
      /*
       * 새 글이 피드 홈에 반영되게 합니다.
       */
      queryClient.invalidateQueries({
        queryKey: feedHomeKeys.all,
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
        '피드 저장에 실패했습니다.',
        getApiErrorDetail(error),
      );

      onError?.(error);
    },
  });

  return {
    createFeed: mutation.mutate,
    isCreatingFeed:
      mutation.isPending,
  };
};

export default useCreateFeed;