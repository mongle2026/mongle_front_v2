import { useQuery } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../../shared/api/client';
import { hasId } from '../../../../shared/utils/id';

import { profileKeys } from '../../api/profileKeys';

// 내가 프로필 주인을 팔로우 중인지.
// GET /follow/:publicId/status → { followingId, isFollowing, isMe }
const useFollowStatus = ({ userId, ownerId }) => {
  const { data: followStatus } = useQuery({
    queryKey: profileKeys.followStatus(userId, ownerId),
    enabled: Boolean(isApiConfigured && hasId(userId) && hasId(ownerId)),
    queryFn: async () => {
      const response = await apiClient.get(`/follow/${ownerId}/status`);

      return {
        isFollowing: Boolean(response.data?.isFollowing),
        isMe: Boolean(response.data?.isMe),
      };
    },
  });

  return { followStatus };
};

export default useFollowStatus;
