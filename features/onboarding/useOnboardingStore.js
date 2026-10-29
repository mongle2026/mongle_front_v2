// 온보딩을 끝까지 봤는지. 로그인 정보와 따로 저장해서 로그아웃 · 탈퇴해도 다시 보이지 않는다.
// SecureStore 는 iOS 에서 앱을 지웠다 다시 깔아도 남을 수 있어서, 그때는 온보딩이 다시 보이지 않을 수 있다

import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const ONBOARDING_STORAGE_KEY = 'onboarding.completed';

export const useOnboardingStore = create(set => ({
  // 앱을 켜고 저장된 값을 다 읽었는지
  isRestored: false,
  isCompleted: false,

  restore: async () => {
    let isCompleted = false;

    try {
      isCompleted = (await SecureStore.getItemAsync(ONBOARDING_STORAGE_KEY)) === 'true';
    } catch (error) {
      console.warn('온보딩 완료 여부를 읽지 못했습니다.', error?.message ?? error);
    }

    set({ isRestored: true, isCompleted });
  },

  // 화면은 바로 넘기고 저장은 뒤에서 한다. 저장에 실패하면 다음 실행 때 온보딩이 한 번 더 보인다
  complete: async () => {
    set({ isCompleted: true });

    try {
      await SecureStore.setItemAsync(ONBOARDING_STORAGE_KEY, 'true');
    } catch (error) {
      console.warn('온보딩 완료 여부를 저장하지 못했습니다.', error?.message ?? error);
    }
  },
}));
