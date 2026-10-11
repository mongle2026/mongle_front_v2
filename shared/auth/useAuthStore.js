// 로그인 상태. 토큰은 SecureStore 에 저장해서 앱을 다시 켜도 로그인이 유지된다.

import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const SESSION_STORAGE_KEY = 'auth.session';

export const AUTH_STATUS = Object.freeze({
  // 앱을 켜고 저장된 토큰을 읽는 중
  RESTORING: 'restoring',
  SIGNED_IN: 'signedIn',
  SIGNED_OUT: 'signedOut',
});

const saveSession = session =>
  SecureStore.setItemAsync(SESSION_STORAGE_KEY, JSON.stringify(session));

/**
 * session: { accessToken, refreshToken, userId } | null
 */
export const useAuthStore = create((set, get) => ({
  status: AUTH_STATUS.RESTORING,
  session: null,

  restoreSession: async () => {
    let session = null;

    try {
      const saved = await SecureStore.getItemAsync(SESSION_STORAGE_KEY);
      session = saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('저장된 로그인 정보를 읽지 못했습니다.', error?.message ?? error);
    }

    // accessToken 이 만료되었어도 refreshToken 이 있으면 요청할 때 새로 받는다
    if (session?.refreshToken && session?.userId != null) {
      set({ status: AUTH_STATUS.SIGNED_IN, session });
    } else {
      set({ status: AUTH_STATUS.SIGNED_OUT, session: null });
    }
  },

  // 로그인 · 가입 응답({ accessToken, refreshToken, user })으로 로그인한다
  signIn: async ({ accessToken, refreshToken, user }) => {
    const session = { accessToken, refreshToken, userId: user.userId };

    await saveSession(session);
    set({ status: AUTH_STATUS.SIGNED_IN, session });
  },

  // refresh 로 새로 받은 토큰. 그 사이 로그아웃했으면 저장하지 않는다
  updateTokens: async ({ accessToken, refreshToken }) => {
    const { session } = get();
    if (!session) return;

    const nextSession = { ...session, accessToken, refreshToken };

    await saveSession(nextSession);
    set({ session: nextSession });
  },

  signOut: async () => {
    set({ status: AUTH_STATUS.SIGNED_OUT, session: null });

    try {
      await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
    } catch (error) {
      console.warn('저장된 로그인 정보를 지우지 못했습니다.', error?.message ?? error);
    }
  },
}));
