import axios from 'axios';
import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import {
  useRecordFormStore,
} from '../../store/useRecordFormStore';

import {
  useFeedFormStore,
} from '../../store/useFeedFormStore';

import {
  createFeedFormData,
} from '../../utils/createFeedFormData';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL
    ?.replace(/\/+$/, '');

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

  const resetFeedForm =
    useFeedFormStore(
      state => state.resetFeedForm,
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
       * 저장 버튼을 누른 순간의
       * 최신 form 값을 가져옵니다.
       */
      const recordForm =
        useRecordFormStore.getState();

      const feedForm =
        useFeedFormStore.getState();

      const formData =
        createFeedFormData({
          userId,
          recordForm,
          feedForm,
        });

      const response =
        await axios.post(
          `${API_BASE_URL}/feed`,
          formData,
          {
            headers: {
              'Content-Type':
                'multipart/form-data',
            },
            transformRequest:
              data => data,
          },
        );

      return response.data;
    },

    onSuccess: data => {
      /*
       * 새 글이 피드 홈에 반영되게 합니다.
       */
      queryClient.invalidateQueries({
        queryKey: ['feed-home'],
      });

      /*
       * 서버 저장에 성공한 경우에만
       * 작성 상태를 초기화합니다.
       */
      resetRecordForm();
      resetFeedForm();

      onSuccess?.(data);
    },

    onError: error => {
      console.warn(
        '피드 저장에 실패했습니다.',
        error.response?.data ??
        error.message,
      );

      onError?.(error);
    },
  });

  return {
    createFeed: mutation.mutate,
    createFeedAsync:
      mutation.mutateAsync,
    isCreatingFeed:
      mutation.isPending,
    createFeedError:
      mutation.error,
  };
};

export default useCreateFeed;