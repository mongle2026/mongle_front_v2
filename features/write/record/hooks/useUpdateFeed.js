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
  uploadRecordFiles,
} from '../../utils/uploadRecordFiles';

import {
  feedDetailKeys,
  feedHomeKeys,
} from '../../../feed/api/feedCache';

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

      /*
       * 압축과 업로드를 요청 전에 끝내 둡니다.
       * 여기서 실패하면 서버에 아무것도 반영하지 않고 끝납니다.
       */
      const uploadableFiles =
        await prepareRecordFiles(recordForm.files);

      const files =
        await uploadRecordFiles({
          userId,
          files: uploadableFiles,
        });

      /*
       * 업로드가 끝난 파일 정보를 같이 보내면
       * 서버가 피드와 파일을 한 트랜잭션에서 저장합니다.
       */
      const response =
        await apiClient.patch(
          `/feed/${feedId}`,
          {
            music: JSON.stringify(recordForm.music),
            text: recordForm.text ?? '',
            font: recordForm.font ?? 'KYOBO',
            visibility: recordForm.visibility ?? 'PUBLIC',
            deleteFileIds,
            files,
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
       * 피드 홈과 상세 화면에 수정 내용이 반영되게 합니다.
       */
      queryClient.invalidateQueries({
        queryKey: feedHomeKeys.all,
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
