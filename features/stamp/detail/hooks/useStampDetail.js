import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { STAMPS } from '../../../../shared/data/envelopeData';
import { resolveMediaUri } from '../../../../shared/utils/media';

import { normalizeLetterboxItem } from '../../../letter/box/hooks/useLetterBox';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');

function normalizeStampDetail(data) {
  const rawSenders = Array.isArray(data?.senders) ? data.senders : [];
  const rawLetters = Array.isArray(data?.letters) ? data.letters : [];

  return {
    count: Number(data?.count) || 0,
    firstCollectedAt: data?.firstCollectedAt ?? null,
    // 이 우표를 보내준 사람 (왼쪽이 오래된 순)
    senders: rawSenders
      .filter(sender => sender?.userId)
      .map(sender => ({
        userId: Number(sender.userId),
        nickname: sender.nickname ?? '',
        imageUri: resolveMediaUri(sender.profileImageUrl),
        isMe: Boolean(sender.isMe),
      })),
    // 이 우표가 붙은 수집한 편지 (최근 도착 순). 날짜는 도착 시각으로 보여준다.
    // 편지 뒷면(Letter type="back")에 받는 사람/보낸 사람 이름을 함께 쓴다.
    letters: rawLetters
      .map(item => {
        const letter = normalizeLetterboxItem(item);
        return (
          letter && {
            ...letter,
            receivedAt: item.arrivedAt ?? letter.receivedAt,
            recipientName: item.receiver?.nickname ?? '',
            senderName: item.sender?.nickname ?? '',
          }
        );
      })
      .filter(Boolean),
  };
}

// 우표 상세 조회. GET /stamp/:code?userId=
// 우표 이미지는 프론트(envelopeData)에서 code로 관리하므로 로컬에서 찾는다.
// queryKey는 ['letterbox', 'stamp', ...]로 둔다 (편지 전송/읽음/삭제 시 함께 갱신된다).
const useStampDetail = ({ stampCode, userId } = {}) => {
  const stamp = useMemo(() => STAMPS.find(item => item.id === stampCode) ?? null, [stampCode]);
  const isConfigured = Boolean(API_BASE_URL && Number(userId) > 0 && stamp);

  const { data: detail, error, isLoading, refetch } = useQuery({
    queryKey: ['letterbox', 'stamp', Number(userId), stampCode],
    enabled: isConfigured,
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/stamp/${stampCode}`, { params: { userId } });
      return normalizeStampDetail(response.data);
    },
  });

  return {
    stamp,
    detail: detail ?? null,
    error,
    isConfigured,
    isLoading,
    refetchDetail: refetch,
  };
};

export default useStampDetail;
