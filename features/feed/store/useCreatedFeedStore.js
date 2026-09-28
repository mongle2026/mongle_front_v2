// 방금 작성한 피드 id. 피드 홈이 이 글이 맨 위에 올라온 걸 확인하고 스크롤을 올린 뒤 비운다

import { create } from 'zustand';

export const useCreatedFeedStore = create((set) => ({
  createdFeedId: null,

  setCreatedFeedId: (feedId) => set({ createdFeedId: feedId ?? null }),

  clearCreatedFeedId: () => set({ createdFeedId: null }),
}));
