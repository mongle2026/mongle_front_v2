import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../../../shared/api/client';

import { STAMPS } from '../../../../../shared/data/envelopeData';

import { letterboxKeys } from '../../../api/letterboxKeys';

// 백엔드 응답 → { [stampCode]: 받은 횟수 }
function normalizeStampCounts(data) {
  const rawItems = Array.isArray(data?.items) ? data.items : [];

  return rawItems.reduce((counts, item) => {
    if (item?.code) counts[item.code] = Number(item.count) || 0;
    return counts;
  }, {});
}

// 편지함 우표 탭. GET /stamp?userId=
// 우표 목록은 프론트(envelopeData STAMPS)가 기준이고, 서버에서는 받은 횟수만 받아 합친다.
// 서버에 없는(또는 아직 못 불러온) 우표는 받은 적 없는 우표(count 0)로 둔다.
const useStampBox = ({ userId } = {}) => {
  const isConfigured = Boolean(isApiConfigured && Number(userId) > 0);

  const { data: counts, refetch } = useQuery({
    queryKey: letterboxKeys.stamps(userId),
    enabled: isConfigured,
    queryFn: async () => {
      const response = await apiClient.get('/stamp', { params: { userId } });
      return normalizeStampCounts(response.data);
    },
  });

  const stamps = useMemo(
    () => STAMPS.map(stamp => ({ stampCode: stamp.id, count: counts?.[stamp.id] ?? 0 })),
    [counts],
  );

  return {
    stamps,
    refetchStamps: refetch,
  };
};

export default useStampBox;
