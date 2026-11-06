import { archiveKeys } from '../../archive/api/archiveKeys';
import { feedCommentKeys, feedDetailKeys, feedHomeKeys } from '../../feed/api/feedCache';
import { letterDetailKeys } from '../../letterbox/api/letterboxKeys';
import { profileKeys } from '../../profile/api/profileKeys';
import { recipientKeys } from '../../write/recipient/api/recipientKeys';
import { removeInfiniteItems } from '../../../shared/api/infiniteCache';
import { isSameId, toIdKey } from '../../../shared/utils/id';

import { blockKeys } from './blockKeys';

/*
 * 차단 / 차단 해제가 서버에 반영된 뒤 캐시를 맞춘다.
 * 차단하면 서로의 피드 · 댓글이 안 보이고 팔로우가 양쪽 모두 끊기며, 해제하면 피드 · 댓글이 다시 보인다(팔로우는 되돌리지 않는다).
 */
export function applyBlockState(queryClient, { userId, targetUserId, nextBlocked }) {
  // 그 사람 프로필의 버튼(차단 해제 / 팔로우)을 바로 바꾼다. 차단하면 팔로우도 끊긴다
  queryClient.setQueryData(
    profileKeys.followStatus(userId, targetUserId),
    status => (status
      ? {
        ...status,
        isBlocked: nextBlocked,
        isFollowing: nextBlocked ? false : status.isFollowing,
      }
      : status),
  );

  // 차단 목록: 해제하면 그 사람을 바로 빼고, 차단하면 다음에 들어갈 때 맨 위에 오도록 새로 받는다
  if (nextBlocked) {
    queryClient.invalidateQueries({ queryKey: blockKeys.list(userId) });
  } else {
    queryClient.setQueryData(
      blockKeys.list(userId),
      list => removeInfiniteItems(list, user => isSameId(user.id, targetUserId)),
    );
  }

  // 그 사람에게 받은 편지 상세의 답장 버튼이 차단 해제 안내를 띄울지 바로 바꾼다
  queryClient.setQueriesData({ queryKey: letterDetailKeys.all }, letter => (
    letter && letter.isReceiver && !letter.isSender && isSameId(letter.sender?.userId, targetUserId)
      ? { ...letter, isSenderBlocked: nextBlocked }
      : letter
  ));

  // 홈(추천/팔로잉) · 댓글 · 북마크 · 그 사람 프로필 그리드에서 그 사람 글이 빠지거나 다시 들어온다
  queryClient.invalidateQueries({ queryKey: feedHomeKeys.user(userId) });
  queryClient.invalidateQueries({ queryKey: feedCommentKeys.all });
  queryClient.invalidateQueries({ queryKey: archiveKeys.bookmark(userId) });
  queryClient.invalidateQueries({ queryKey: profileKeys.userCovers(userId, targetUserId) });

  // 지금 보고 있는 피드 상세를 바로 다시 받으면 404(삭제된 피드 안내)가 떠서, 다음에 들어갈 때 받게만 한다
  queryClient.invalidateQueries({ queryKey: feedDetailKeys.user(userId), refetchType: 'none' });

  // 팔로우가 끊겼으니 팔로우 / 팔로워 목록과 수신인 기본 목록(나 + 팔로잉)도 새로 받는다
  queryClient.invalidateQueries({ queryKey: ['profile', 'follow', toIdKey(userId)] });
  queryClient.removeQueries({ queryKey: recipientKeys.all });
}
