import apiClient, { getApiErrorDetail } from '../../../../shared/api/client';
import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import {
  useRecordFormStore,
} from '../../store/useRecordFormStore';

import {
  useLetterFormStore,
} from '../../store/useLetterFormStore';

import {
  prepareRecordFiles,
  uploadRecordFilesAfterSave,
} from '../../utils/uploadRecordFiles';

import {
  letterboxKeys,
} from '../../../letterbox/api/letterboxKeys';

const useCreateLetter = ({
  userId,
  onSuccess,
  onError,
} = {}) => {
  const queryClient = useQueryClient();

  const resetRecordForm =
    useRecordFormStore(
      state => state.resetRecordForm,
    );

  const resetLetterForm =
    useLetterFormStore(
      state => state.resetLetterForm,
    );

  const mutation = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error(
          '사용자 정보가 없습니다.',
        );
      }

      /*
       * 전송 버튼을 누른 순간의
       * 최신 form 값을 가져옵니다.
       */
      const recordForm =
        useRecordFormStore.getState();

      const letterForm =
        useLetterFormStore.getState();

      if (!letterForm.receiver) {
        throw new Error(
          '수신인 정보가 없습니다.',
        );
      }

      /*
       * 압축은 요청 전에 끝내 둡니다.
       * 압축이 실패하면 서버에 아무것도 반영하지 않고 끝납니다.
       */
      const uploadableFiles =
        await prepareRecordFiles(recordForm.files);

      const response =
        await apiClient.post(
          '/letter',
          {
            userId: String(userId),
            music: JSON.stringify(recordForm.music),
            text: recordForm.text ?? '',
            font: recordForm.font ?? 'KYOBO',

            receiverId: String(letterForm.receiver.id),
            pattern: letterForm.patternId ?? '',
            color: letterForm.colorId ?? '',
            stamp: letterForm.stampId ?? '',

            ...(letterForm.deliveryAt
              ? { deliveryAt: letterForm.deliveryAt }
              : {}),
          },
        );

      /*
       * 이미지는 편지 생성 이후
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
       * 편지함에 새 편지가 반영되게 합니다.
       */
      queryClient.invalidateQueries({
        queryKey: letterboxKeys.all,
      });

      /*
       * 서버 저장에 성공한 경우에만
       * 작성 상태를 초기화합니다.
       */
      resetRecordForm();
      resetLetterForm();

      onSuccess?.(data);
    },

    onError: error => {
      console.warn(
        '편지 저장에 실패했습니다.',
        getApiErrorDetail(error),
      );

      onError?.(error);
    },
  });

  return {
    createLetter: mutation.mutate,
    isCreatingLetter:
      mutation.isPending,
  };
};

export default useCreateLetter;
