// 피드 홈 코치마크(작성 FAB 안내)를 끝까지 봤는지. 앱을 처음 깔고 피드 홈에 들어왔을 때 한 번만 보여 준다.
// 로그인 정보와 따로 저장해서 로그아웃 · 탈퇴해도 다시 보이지 않는다.
// SecureStore 는 iOS 에서 앱을 지웠다 다시 깔아도 남을 수 있어서, 그때는 코치마크가 다시 보이지 않을 수 있다

import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const FEED_COACHMARK_STORAGE_KEY = 'feed.coachmarkCompleted';

export const useFeedCoachmarkStore = create((set, get) => ({
  // 저장된 값을 다 읽었는지
  isRestored: false,
  isCompleted: false,

  // 피드 홈이 다시 마운트돼도 한 번만 읽는다. 저장 중에 다시 읽어서 완료 전 값으로 돌아가지 않게 한다
  restore: async () => {
    if (get().isRestored) return;

    let isCompleted = false;

    try {
      isCompleted = (await SecureStore.getItemAsync(FEED_COACHMARK_STORAGE_KEY)) === 'true';
    } catch (error) {
      console.warn('피드 코치마크 완료 여부를 읽지 못했습니다.', error?.message ?? error);
    }

    set({ isRestored: true, isCompleted });
  },

  // 화면은 바로 돌려놓고 저장은 뒤에서 한다. 저장에 실패하면 다음 실행 때 코치마크가 한 번 더 보인다
  complete: async () => {
    set({ isCompleted: true });

    try {
      await SecureStore.setItemAsync(FEED_COACHMARK_STORAGE_KEY, 'true');
    } catch (error) {
      console.warn('피드 코치마크 완료 여부를 저장하지 못했습니다.', error?.message ?? error);
    }
  },
}));
