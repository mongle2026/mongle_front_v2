import { useMemo } from 'react';

import { STAMPS } from '../../../../shared/data/envelopeData';

// 우표 상세 조회.
// 우표 이미지는 프론트(envelopeData)에서 code로 관리하므로 로컬에서 찾는다.
// TODO: 백엔드 우표 상세 API가 생기면 useQuery로 이 우표가 붙은 편지 목록 등을 불러온다.
const useStampDetail = ({ stampCode } = {}) => {
  const stamp = useMemo(() => STAMPS.find(item => item.id === stampCode) ?? null, [stampCode]);

  return {
    stamp,
  };
};

export default useStampDetail;
