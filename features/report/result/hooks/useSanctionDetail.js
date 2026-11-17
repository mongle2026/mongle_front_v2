import { useQuery } from '@tanstack/react-query';

import apiClient, { isApiConfigured } from '../../../../shared/api/client';
import { useAuthStore } from '../../../../shared/auth/useAuthStore';
import { hasId, toIdKey } from '../../../../shared/utils/id';

// 제재 기록은 되돌리기 말고는 바뀌지 않아서 길게 둔다
const DETAIL_STALE_TIME = 10 * 60 * 1000;

export const sanctionKeys = {
  detail: (userId, sanctionId) => [
    'sanction',
    toIdKey(userId),
    toIdKey(sanctionId),
  ],
};

/**
 * 운영정책 안내 · 이용 정지 해제 안내 화면의 제재 상세. GET /sanction/:sanctionId
 * sanctionId 는 알림 목록 항목(policy_notice · restriction_expired)에 있다. 없으면 부르지 않는다
 *
 * 응답: {
 *   type, reason, targetType, preview,
 *   userCode,  → 댓글은 댓글을 단 피드의 작성자, 편지는 받은 사람 아이디. 피드 · 회원 신고거나 상대가 탈퇴했으면 null
 *   profileImageUrl,  → 내 프로필 이미지
 *   sanctionedAt, restriction, restrictedAt, restrictedUntil,
 *   warnings: [{ warnedAt, targetType }],  → 이 제재 때 유효했던 경고, 오래된 순
 * }
 */
const useSanctionDetail = sanctionId => {
  const userId = useAuthStore(state => state.session?.userId ?? null);

  return useQuery({
    queryKey: sanctionKeys.detail(userId, sanctionId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/sanction/${sanctionId}`);
      return data;
    },
    enabled: isApiConfigured && hasId(userId) && hasId(sanctionId),
    staleTime: DETAIL_STALE_TIME,
  });
};

export default useSanctionDetail;
