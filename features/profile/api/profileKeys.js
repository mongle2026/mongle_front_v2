import { archiveKeys } from '../../archive/api/archiveKeys';

// 프로필 react-query 키.
// 보관함 내 기록 아래에 두어서 피드 작성/수정/삭제 후 archiveKeys.all invalidate 로 같이 갱신된다.
// 게시글 편집 목록도 covers 아래에 있어서, 편집 저장 후 covers 하나만 invalidate 하면 둘 다 갱신된다
export const profileKeys = {
  // 프로필 노래 커버 그리드 (편집에서 고른 글만)
  covers: userId => [...archiveKeys.myFeed(userId), 'profile'],
  // 게시글 편집 목록 (내 글 전체 + 프로필에서 뺐는지)
  editCovers: userId => [...archiveKeys.myFeed(userId), 'profile', 'edit'],
};
