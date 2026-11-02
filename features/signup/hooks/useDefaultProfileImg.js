import { useQuery } from '@tanstack/react-query';

import apiClient, { isApiConfigured } from '../../../shared/api/client';
import { resolveMediaUri } from '../../../shared/utils/media';

/**
 * 가입 화면의 기본 프로필 사진. 서버의 기본 사진 목록에서 한 장을 랜덤으로 고른다.
 * 고른 사진을 캐시에 두어서, 약관 화면으로 돌아갔다 와도 같은 사진을 보여준다.
 * 약관 화면에서 prefetchQuery 로 미리 불러 둔다.
 */
export const defaultProfileImgQuery = {
  queryKey: ['default-profile-img'],

  // GET /user/default-profile-images → [{ no, url }]
  queryFn: async () => {
    const response = await apiClient.get('/user/default-profile-images');
    const defaultProfileImgs = response.data;
    const { no, url } = defaultProfileImgs[Math.floor(Math.random() * defaultProfileImgs.length)];

    return { uri: resolveMediaUri(url), defaultProfileImgNo: no };
  },

  enabled: isApiConfigured,
  staleTime: Infinity,
};

/**
 * defaultProfileImg: { uri, defaultProfileImgNo }. 불러오기 전이거나 실패하면 null 이고,
 * 이때 가입하면 서버가 기본 사진을 고른다
 */
const useDefaultProfileImg = () => {
  const { data: defaultProfileImg = null } = useQuery(defaultProfileImgQuery);

  return { defaultProfileImg };
};

export default useDefaultProfileImg;
