import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../../../shared/api/client';
import { resolveMediaUri } from '../../../../../shared/utils/media';

import { archiveKeys } from '../../../api/archiveKeys';
import { SESSION_COVER_SEED } from '../../utils/sessionCover';

// 모든 기록의 월 목록. GET /feed/me/months?userId=&limit=&coverSeed=
// 글을 쓴 달만 최신 달부터 온다(month: 한국 시간 'YYYY-MM').
// 커버는 서버가 그 달 글들의 앨범 커버 중 하나를 골라 준다(앱 실행 동안 고정).
const useMyFeedMonths = ({ userId, limit }) => {
  const isConfigured = Boolean(isApiConfigured && Number(userId) > 0);

  const { data, isPending } = useQuery({
    queryKey: archiveKeys.myFeedMonths(userId, limit),
    enabled: isConfigured,
    queryFn: async () => {
      const response = await apiClient.get('/feed/me/months', {
        params: { userId, limit, coverSeed: SESSION_COVER_SEED },
      });
      return Array.isArray(response.data?.items) ? response.data.items : [];
    },
  });

  const months = useMemo(
    () => (data ?? []).map(item => {
      const coverUri = resolveMediaUri(item.artwork);

      return {
        month: item.month,
        feedCount: item.feedCount,
        imageSource: coverUri ? { uri: coverUri } : undefined,
      };
    }),
    [data],
  );

  return {
    months,
    isMonthsLoading: isConfigured && isPending,
  };
};

export default useMyFeedMonths;
