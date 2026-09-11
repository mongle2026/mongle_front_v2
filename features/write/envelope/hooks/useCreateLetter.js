import axios from 'axios';
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
  uploadRecordFiles,
} from '../../utils/uploadRecordFiles';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL
    ?.replace(/\/+$/, '');

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
      if (!API_BASE_URL) {
        throw new Error(
          'EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다.',
        );
      }

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

      const response =
        await axios.post(
          `${API_BASE_URL}/letter`,
          {
            userId: String(userId),
            music: JSON.stringify(recordForm.music),
            text: recordForm.text ?? '',

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
       * presigned URL을 통해 R2에 직접 업로드합니다.
       */
      await uploadRecordFiles({
        userId,
        recordId: response.data.recordId,
        files: recordForm.files,
      });

      return response.data;
    },

    onSuccess: data => {
      /*
       * 편지함에 새 편지가 반영되게 합니다.
       */
      queryClient.invalidateQueries({
        queryKey: ['letterbox'],
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
        error.response?.data ??
        error.message,
      );

      onError?.(error);
    },
  });

  return {
    createLetter: mutation.mutate,
    createLetterAsync:
      mutation.mutateAsync,
    isCreatingLetter:
      mutation.isPending,
    createLetterError:
      mutation.error,
  };
};

export default useCreateLetter;
