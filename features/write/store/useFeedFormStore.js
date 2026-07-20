// 피드 작성에만 필요한 값

import { create } from 'zustand';

const initialState = {
  visibility: 'PUBLIC',
};

export const useFeedFormStore = create((set) => ({
  ...initialState,

  setVisibility: (visibility) =>
    set({
      visibility,
    }),

  resetFeedForm: () =>
    set({
      ...initialState,
    }),
}));