import { useQuery } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../../shared/api/client';
import { resolveMediaUri } from '../../../../shared/utils/media';
import { hasId } from '../../../../shared/utils/id';

import { profileKeys } from '../../api/profileKeys';

// 다른 사람 프로필의 사용자 정보.
// GET /user/:publicId → { userId, userCode, nickname, hasProfileImage, profileImageUrl }
const useUserProfile = ({ ownerId }) => {
  const { data: user } = useQuery({
    queryKey: profileKeys.user(ownerId),
    enabled: Boolean(isApiConfigured && hasId(ownerId)),
    queryFn: async () => {
      const response = await apiClient.get(`/user/${ownerId}`);
      const data = response.data;

      return {
        userId: data.userId,
        userCode: data.userCode ?? '',
        nickname: data.nickname ?? '',
        profileImageUri: resolveMediaUri(data.profileImageUrl),
      };
    },
  });

  return { user };
};

export default useUserProfile;
