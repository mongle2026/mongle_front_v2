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
  feedHomeKeys,
} from '../../../feed/api/feedCache';
import { archiveKeys } from '../../../archive/api/archiveKeys';
import { useCreatedFeedStore } from '../../../feed/store/useCreatedFeedStore';
import { normalizeFeedItem } from '../../../feed/home/hooks/useFeedHome';

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
        await apiClient.post(
          '/feed',
          {
            userId: String(userId),
            music: JSON.stringify(recordForm.music),
            text: recordForm.text ?? '',
            font: recordForm.font ?? 'KYOBO',

            visibility:
              recordForm.visibility ?? 'PUBLIC',

            files,
          },
        );

      return response.data;
    },

    onSuccess: data => {
      const recommendedKey =
        feedHomeKeys.list(userId, 'recommended');
      const createdFeed =
        normalizeFeedItem(data?.feed);

      /*
       * 비공개 글은 서버 피드에 나오지 않으므로
       * 피드에 넣거나 스크롤을 옮기지 않고 보관함에만 반영합니다.
       */
      const isPrivate =
        data?.feed?.visibility === 'PRIVACY';

      /*
       * 새 글을 추천 피드 맨 앞에 직접 넣습니다.
       * 서버 순서를 기다리면 그사이 다른 사람이 쓴 글이 위로 올 수 있습니다.
       * 다시 불러오면 이 순서가 덮어써지므로 추천 피드는 무효화하지 않습니다.
       * 다음 페이지는 id가 더 작은 글만 불러와서 새 글이 중복되지 않습니다.
       */
      let hasPrepended = false;

      if (createdFeed && !isPrivate) {
        queryClient.setQueryData(
          recommendedKey,
          queryData => {
            if (!queryData?.pages?.length) return queryData;

            hasPrepended = true;

            const [firstPage, ...restPages] = queryData.pages;
            const firstItems = (firstPage.items ?? []).filter(
              item => String(item?.feedId) !== String(createdFeed.feedId),
            );

            return {
              ...queryData,
              pages: [
                { ...firstPage, items: [createdFeed, ...firstItems] },
                ...restPages,
              ],
            };
          },
        );
      }

      /*
       * 새 글 정보를 못 받았거나 캐시가 비어 있으면
       * 첫 페이지만 남겨 두고 서버에서 다시 불러옵니다.
       */
      if (!isPrivate && !hasPrepended) {
        queryClient.setQueryData(
          recommendedKey,
          queryData => (queryData?.pages?.length > 1
            ? {
              pages: queryData.pages.slice(0, 1),
              pageParams: queryData.pageParams.slice(0, 1),
            }
            : queryData),
        );

        queryClient.invalidateQueries({
          queryKey: recommendedKey,
        });
      }

      /*
       * 피드 홈이 새 글 위치로 스크롤을 올리도록 알립니다.
       * 팔로잉 피드에는 내 글이 없어서 다시 불러오지 않습니다.
       */
      if (!isPrivate) {
        useCreatedFeedStore.getState().setCreatedFeedId(data?.feedId);
      }

      /*
       * 새 글이 보관함에 반영되게 합니다.
       */
      queryClient.invalidateQueries({
        queryKey: archiveKeys.all,
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