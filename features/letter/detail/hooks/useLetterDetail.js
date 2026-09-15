import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { normalizeFont } from '../../../../shared/styles/font';
import { getImageSources, resolveMediaUri } from '../../../../shared/utils/media';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');

const DETAIL_STALE_TIME = 2 * 60 * 1000;

const getLetterDetailKey = (letterId, userId) => ['letter-detail', Number(letterId), Number(userId)];

// 백엔드 편지 상세({ letter, record }) → 화면에서 쓰는 형태
function normalizeLetterDetail(data, userId) {
  const letter = data?.letter;
  const record = data?.record;
  if (!letter?.id) return null;

  const senderId = Number(record?.userId);
  const receiverId = Number(letter.receiverId);

  return {
    letterId: Number(letter.id),
    isSender: senderId === Number(userId),
    isReceiver: receiverId === Number(userId),
    isRead: Boolean(letter.isRead),
    deliveryAt: letter.deliveryAt,
    createdAt: record?.createdAt,
    envelope: {
      pattern: letter.pattern,
      color: letter.color,
      stamp: letter.stamp,
    },
    sender: {
      userId: senderId,
      nickname: record?.user?.nickname ?? '',
      profileImageUri: resolveMediaUri(record?.user?.profileImageUrl),
    },
    receiver: {
      userId: receiverId,
      nickname: letter.receiver?.nickname ?? '',
      profileImageUri: resolveMediaUri(letter.receiver?.profileImageUrl),
    },
    // 보낸이가 선택한 폰트. TODO: 백엔드 편지 생성/상세에 font 추가 필요
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
  queryClient.setQueriesData({ queryKey: ['letterbox', Number(userId)] }, currentData => {
    if (!currentData?.pages) return currentData;

    return {
      ...currentData,
      pages: currentData.pages.map(page => ({
        ...page,
        items: page.items.map(item => (item.letterId === letterId ? { ...item, isRead: true } : item)),
      })),
    };
  });

  // 안 읽음 탭은 목록에서 빠져야 하므로 다음에 보일 때 다시 불러온다
  void queryClient.invalidateQueries({
    queryKey: ['letterbox', Number(userId), 'UNREAD'],
    refetchType: 'none',
  });
}

// 편지함 목록 캐시(모든 탭)에서 삭제한 편지를 뺀다
function removeLetterFromLetterbox(queryClient, userId, letterId) {
  queryClient.setQueriesData({ queryKey: ['letterbox', Number(userId)] }, currentData => {
    if (!currentData?.pages) return currentData;

    return {
      ...currentData,
      pages: currentData.pages.map(page => ({
        ...page,
        items: page.items.filter(item => item.letterId !== letterId),
      })),
    };
  });
}

// 편지 상세 조회. GET /letter/:letterId?userId=
// 편지 삭제(내 편지함에서만). DELETE /letter/:letterId?userId=
const useLetterDetail = ({ letterId, userId, onDeleteSuccess } = {}) => {
  const queryClient = useQueryClient();
  const isConfigured = Boolean(API_BASE_URL);
  const detailQueryKey = getLetterDetailKey(letterId, userId);

  const { data: letter, error, isLoading, refetch } = useQuery({
    queryKey: detailQueryKey,
    enabled: isConfigured && Number(letterId) > 0 && Number(userId) > 0,
    staleTime: DETAIL_STALE_TIME,
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/letter/${letterId}`, {
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
      const response = await axios.delete(`${API_BASE_URL}/letter/${letterId}`, {
        params: { userId },
      });

      return response.data;
    },

    onSuccess: () => {
      removeLetterFromLetterbox(queryClient, userId, Number(letterId));

      // 화면이 닫히는 동안 다시 불러오면 404가 나므로 stale 처리만 해둔다
      void queryClient.invalidateQueries({ queryKey: detailQueryKey, refetchType: 'none' });

      onDeleteSuccess?.();
    },

    onError: mutationError => {
      console.warn('편지 삭제에 실패했습니다.', mutationError.response?.data ?? mutationError.message);
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
