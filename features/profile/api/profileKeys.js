import { archiveKeys } from '../../archive/api/archiveKeys';
import { toIdKey } from '../../../shared/utils/id';

// 프로필 react-query 키.
// 보관함 내 기록 아래에 두어서 피드 작성/수정/삭제 후 archiveKeys.all invalidate 로 같이 갱신된다.
// 게시글 편집 목록도 covers 아래에 있어서, 편집 저장 후 covers 하나만 invalidate 하면 둘 다 갱신된다
export const profileKeys = {
  // 프로필 노래 커버 그리드 (편집에서 고른 글만)
  covers: userId => [...archiveKeys.myFeed(userId), 'profile'],
  // 게시글 편집 목록 (내 글 전체 + 프로필에서 뺐는지)
  editCovers: userId => [...archiveKeys.myFeed(userId), 'profile', 'edit'],
  // 팔로우 / 팔로워 목록 (커서 페이지네이션). type: followings / followers
  follows: (userId, type) => ['profile', 'follow', toIdKey(userId), type],

  // 다른 사람 프로필. viewerId: 나, ownerId: 프로필 주인
  // 사용자 정보 (닉네임 · 아이디 · 프로필 사진)
  user: ownerId => ['profile', 'user', toIdKey(ownerId)],
  // 내가 프로필 주인을 팔로우 중인지
  followStatus: (viewerId, ownerId) => ['profile', 'follow-status', toIdKey(viewerId), toIdKey(ownerId)],
  // 노래 커버 그리드. 팔로우 여부에 따라 보이는 글(팔로워 공개)이 달라서 보는 사람도 키에 넣는다
  userCovers: (viewerId, ownerId) => ['profile', 'user-covers', toIdKey(viewerId), toIdKey(ownerId)],
};
