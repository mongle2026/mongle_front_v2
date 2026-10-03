import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient, { getApiErrorDetail, isApiConfigured } from '../../../../../shared/api/client';

import { normalizeFont } from '../../../../../shared/styles/fontType';
import { getImageSources, resolveMediaUri } from '../../../../../shared/utils/media';

import { letterboxKeys, letterDetailKeys } from '../../../api/letterboxKeys';
import { hasId, isSameId } from '../../../../../shared/utils/id';
import { mapInfiniteItems, removeInfiniteItems } from '../../../../../shared/api/infiniteCache';

const DETAIL_STALE_TIME = 2 * 60 * 1000;

// 백엔드 편지 상세({ letter, record }) → 화면에서 쓰는 형태
function normalizeLetterDetail(data, userId) {
  const letter = data?.letter;
  const record = data?.record;
  if (!letter?.id) return null;

  return {
    letterId: letter.id,
    isSender: isSameId(record?.userId, userId),
    isReceiver: isSameId(letter.receiverId, userId),
    isRead: Boolean(letter.isRead),
    deliveryAt: letter.deliveryAt,
    createdAt: record?.createdAt,
    envelope: {
      pattern: letter.pattern,
      color: letter.color,
      stamp: letter.stamp,
    },
    sender: {
      userId: record?.userId,
      nickname: record?.user?.nickname ?? '',
      profileImageUri: resolveMediaUri(record?.user?.profileImageUrl),
    },
    receiver: {
      userId: letter.receiverId,
      nickname: letter.receiver?.nickname ?? '',
      profileImageUri: resolveMediaUri(letter.receiver?.profileImageUrl),
    },
    // 보낸이가 선택한 폰트
    font: normalizeFont(record?.font),
    text: record?.text ?? '',
    imageSources: getImageSources(record?.files),
    music: {
      title: record?.music?.musicTitle ?? '',
      singer: record?.music?.musicArtist ?? '',
      artworkUri: resolveMediaUri(record?.music?.musicArtwork),
      previewUri: resolveMediaUri(record?.music?.previewUrl),
    },
  };
}

// 편지함 목록 캐시에서 해당 편지를 읽음 처리한다 (백엔드는 상세 조회 시 읽음 처리한다)
function markLetterAsReadInLetterbox(queryClient, userId, letterId) {
  queryClient.setQueriesData({ queryKey: letterboxKeys.letters(userId) }, currentData =>
    mapInfiniteItems(currentData, item =>
      isSameId(item.letterId, letterId) && !item.isRead ? { ...item, isRead: true } : item,
    ),
  );

  // 안 읽음 탭은 목록에서 빠져야 하므로 다음에 보일 때 다시 불러온다
  void queryClient.invalidateQueries({
    queryKey: letterboxKeys.letterList(userId, 'UNREAD'),
    refetchType: 'none',
  });

  // 우표 상세의 편지 목록 (useStampDetail)
  queryClient.setQueriesData({ queryKey: letterboxKeys.stamps(userId) }, currentData => {
    if (!currentData?.letters) return currentData;

    return {
      ...currentData,
      letters: currentData.letters.map(item => (isSameId(item.letterId, letterId) ? { ...item, isRead: true } : item)),
    };
  });
}

// 편지함 목록 캐시(모든 탭)에서 삭제한 편지를 뺀다
function removeLetterFromLetterbox(queryClient, userId, letterId) {
  queryClient.setQueriesData({ queryKey: letterboxKeys.letters(userId) }, currentData =>
    removeInfiniteItems(currentData, item => isSameId(item.letterId, letterId)),
  );

  // 우표 수집 횟수/우표 상세도 바뀌므로 다시 불러온다 (useStampBox, useStampDetail)
  void queryClient.invalidateQueries({ queryKey: letterboxKeys.stamps(userId) });
}

// 편지 상세 조회. GET /letter/:letterId?userId=
// 편지 삭제(내 편지함에서만). DELETE /letter/:letterId?userId=
const useLetterDetail = ({ letterId, userId, onDeleteSuccess } = {}) => {
  const queryClient = useQueryClient();
  const isConfigured = isApiConfigured;
  const detailQueryKey = letterDetailKeys.detail(letterId, userId);

  const { data: letter, error, isLoading, refetch } = useQuery({
    queryKey: detailQueryKey,
    enabled: isConfigured && hasId(letterId) && hasId(userId),
    staleTime: DETAIL_STALE_TIME,
    queryFn: async () => {
      const response = await apiClient.get(`/letter/${letterId}`, {
        params: { userId },
      });

      const nextLetter = normalizeLetterDetail(response.data, userId);

      if (nextLetter?.isReceiver) {
        markLetterAsReadInLetterbox(queryClient, userId, nextLetter.letterId);
      }

      return nextLetter;
    },
  });

  const deleteLetterMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete(`/letter/${letterId}`, {
        params: { userId },
      });

      return response.data;
    },

    onSuccess: () => {
      removeLetterFromLetterbox(queryClient, userId, letterId);

      // 화면이 닫히는 동안 다시 불러오면 404가 나므로 stale 처리만 해둔다
      void queryClient.invalidateQueries({ queryKey: detailQueryKey, refetchType: 'none' });

      onDeleteSuccess?.();
    },

    onError: mutationError => {
      console.warn('편지 삭제에 실패했습니다.', getApiErrorDetail(mutationError));
    },
  });

  return {
    letter,
    error,
    isConfigured,
    isLoading,
    refetchLetter: refetch,
    deleteLetter: deleteLetterMutation.mutate,
    isDeletingLetter: deleteLetterMutation.isPending,
  };
};

export default useLetterDetail;
