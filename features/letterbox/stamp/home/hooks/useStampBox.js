import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../../../shared/api/client';

import { STAMPS } from '../../../../../shared/data/envelopeData';

import { letterboxKeys } from '../../../api/letterboxKeys';
import { hasId } from '../../../../../shared/utils/id';

// 백엔드 응답 → { [stampCode]: 받은 횟수 }
function normalizeStampCounts(data) {
  const rawItems = Array.isArray(data?.items) ? data.items : [];

  return rawItems.reduce((counts, item) => {
    if (item?.code) counts[item.code] = Number(item.count) || 0;
    return counts;
  }, {});
}

const isStampBoxConfigured = userId => Boolean(isApiConfigured && hasId(userId));

const getStampBoxQueryOptions = userId => ({
  queryKey: letterboxKeys.stamps(userId),
  queryFn: async () => {
    const response = await apiClient.get('/stamp');
    return normalizeStampCounts(response.data);
  },
});

// 편지함 화면에 들어올 때 미리 불러온다. 우표 탭을 열 때 데이터가 이미 있으면
// 전부 회색으로 그렸다가 받은 우표만 다시 그리는 일이 없다.
export const prefetchStampBox = (queryClient, { userId }) => {
  if (!isStampBoxConfigured(userId)) return;
  void queryClient.prefetchQuery(getStampBoxQueryOptions(userId));
};

// 편지함 우표 탭. GET /stamp
// 우표 목록은 프론트(envelopeData STAMPS)가 기준이고, 서버에서는 받은 횟수만 받아 합친다.
// 서버에 없는(또는 아직 못 불러온) 우표는 받은 적 없는 우표(count 0)로 둔다.
const useStampBox = ({ userId } = {}) => {
  const { data: counts, refetch } = useQuery({
    ...getStampBoxQueryOptions(userId),
    enabled: isStampBoxConfigured(userId),
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
