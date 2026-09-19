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
       * 압축은 요청 전에 끝내 둡니다.
       * 압축이 실패하면 서버에 아무것도 반영하지 않고 끝납니다.
       */
      const uploadableFiles =
        await prepareRecordFiles(recordForm.files);

      const response =
        await apiClient.patch(
          `/feed/${feedId}`,
          {
            music: JSON.stringify(recordForm.music),
            text: recordForm.text ?? '',
            font: recordForm.font ?? 'KYOBO',
            visibility: recordForm.visibility ?? 'PUBLIC',
            deleteFileIds,
          },
          {
            params: {
              userId: String(userId),
            },
          },
        );

      /*
       * 이미지는 피드 수정 이후
       * presigned URL을 통해 R2에 업로드합니다.
       *
       * 여기서 실패해도 수정 내용(삭제한 기존 이미지 포함)은 이미 저장된 상태라서,
       * 실패로 처리하면 화면과 서버 상태가 어긋납니다.
       * 그래서 부분 성공(fileUploadFailed)으로 돌려주고 화면에서 안내합니다.
       * TODO: 레코드와 파일을 한 번에 저장하도록 백엔드와 협의
       */
      let fileUploadFailed = false;

      try {
        await uploadRecordFiles({
          userId,
          recordId: response.data.recordId,
          files: uploadableFiles,
        });
      } catch (error) {
        console.warn(
          '이미지 업로드에 실패했습니다.',
          getApiErrorDetail(error),
        );

        fileUploadFailed = true;
      }

      return {
        ...response.data,
        fileUploadFailed,
      };
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
