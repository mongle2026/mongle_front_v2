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
  prepareRecordSubmission,
} from '../../utils/recordSubmission';

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
      /*
       * 전송 버튼을 누른 순간의
       * 최신 form 값을 가져옵니다.
       * 수신인이 없으면 업로드하기 전에 멈춥니다.
       */
      const letterForm =
        useLetterFormStore.getState();

      if (!letterForm.receiver) {
        throw new Error(
          '수신인 정보가 없습니다.',
        );
      }

      const { recordBody } =
        await prepareRecordSubmission({ userId });

      const response =
        await apiClient.post(
          '/letter',
          {
            userId: String(userId),
            ...recordBody,

            receiverId: String(letterForm.receiver.id),
            pattern: letterForm.patternId ?? '',
            color: letterForm.colorId ?? '',
            stamp: letterForm.stampId ?? '',

            ...(letterForm.deliveryAt
              ? { deliveryAt: letterForm.deliveryAt }
              : {}),
          },
        );

      return response.data;
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
