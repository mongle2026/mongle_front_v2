import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../../../shared/api/client';

import { findStamp } from '../../../../../shared/data/envelopeData';
import { resolveMediaUri } from '../../../../../shared/utils/media';

import { normalizeLetterboxItem } from '../../../utils/normalizeLetter';
import { letterboxKeys } from '../../../api/letterboxKeys';

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

const isStampDetailConfigured = ({ stampCode, userId }) =>
  Boolean(isApiConfigured && Number(userId) > 0 && findStamp(stampCode));

const getStampDetailQueryOptions = ({ stampCode, userId }) => ({
  queryKey: letterboxKeys.stampDetail(userId, stampCode),
  queryFn: async () => {
    const response = await apiClient.get(`/stamp/${stampCode}`, { params: { userId } });
    return normalizeStampDetail(response.data);
  },
});

// 우표를 누르는 순간 불러오기 시작해서, 우표 상세 시트가 뜰 때는 데이터가 준비되어 있게 한다.
// (시트가 올라가는 도중에 데이터가 들어와 높이가 바뀌면 프레임이 끊긴다)
export const prefetchStampDetail = (queryClient, { stampCode, userId }) => {
  if (!isStampDetailConfigured({ stampCode, userId })) return;
  void queryClient.prefetchQuery(getStampDetailQueryOptions({ stampCode, userId }));
};

// 우표 상세 조회. GET /stamp/:code?userId=
// 우표 이미지는 프론트(envelopeData)에서 code로 관리하므로 로컬에서 찾는다.
const useStampDetail = ({ stampCode, userId } = {}) => {
  const stamp = useMemo(() => findStamp(stampCode), [stampCode]);
  const isConfigured = isStampDetailConfigured({ stampCode, userId });

  const { data: detail, error } = useQuery({
    ...getStampDetailQueryOptions({ stampCode, userId }),
    enabled: isConfigured,
  });

  return {
    stamp,
    detail: detail ?? null,
    error,
  };
};

export default useStampDetail;
