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
  uploadRecordFiles,
} from '../../utils/uploadRecordFiles';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL
    ?.replace(/\/+$/, '');

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

      if (!feedId) {
        throw new Error(
          '수정할 피드 정보가 없습니다.',
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
        await axios.patch(
          `${API_BASE_URL}/feed/${feedId}`,
          {
            music: JSON.stringify(recordForm.music),
            text: recordForm.text ?? '',
            font: recordForm.font ?? 'KYOBO',
            visibility: feedForm.visibility ?? 'PUBLIC',
            deleteFileIds,
          },
          {
            params: {
              userId: String(userId),
            },
          },
        );

      /*
       * 새로 추가된 이미지만 presigned URL을 통해
       * R2에 업로드합니다. (isRemote 파일은 건너뜁니다.)
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
       * 피드 홈과 상세 화면에 수정 내용이 반영되게 합니다.
       */
      queryClient.invalidateQueries({
        queryKey: ['feed-home'],
      });

      queryClient.invalidateQueries({
        queryKey: ['feed-detail', String(feedId)],
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
        '피드 수정에 실패했습니다.',
        error.response?.data ??
        error.message,
      );

      onError?.(error);
    },
  });

  return {
    updateFeed: mutation.mutate,
    updateFeedAsync:
      mutation.mutateAsync,
    isUpdatingFeed:
      mutation.isPending,
    updateFeedError:
      mutation.error,
  };
};

export default useUpdateFeed;
