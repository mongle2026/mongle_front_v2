import { useCallback, useRef } from 'react';

import apiClient, { getApiErrorDetail } from '../../../shared/api/client';
import { useAuthStore } from '../../../shared/auth/useAuthStore';
import { unregisterPushToken } from '../../notification/push/registerPushToken';

// 서버 응답이 늦어도 로그아웃이 오래 멈춰 있지 않게 기본(15초)보다 짧게 기다린다
const LOGOUT_REQUEST_TIMEOUT = 5_000;

/**
 * 로그아웃. 서버에서 이 기기 푸시 토큰과 refresh token 을 지운 뒤 앱의 로그인 정보를 지운다.
 * 서버 요청은 로그인 토큰이 필요해서 signOut 보다 먼저 보낸다.
 * 서버 요청이 실패해도(오프라인 등) 앱에서는 로그아웃한다.
 * 서버에 남은 refresh token 은 만료되거나 다음 로그인 때 무효가 된다.
 */
const useLogout = () => {
  const signOut = useAuthStore(state => state.signOut);
  const isLoggingOutRef = useRef(false);

  return useCallback(async () => {
    if (isLoggingOutRef.current) return;

    isLoggingOutRef.current = true;

    const config = { timeout: LOGOUT_REQUEST_TIMEOUT };

    try {
      const results = await Promise.allSettled([
        unregisterPushToken(config),
        apiClient.post('/auth/logout', undefined, config),
      ]);

      results
        .filter(result => result.status === 'rejected')
        .forEach(({ reason }) => {
          console.warn('서버 로그아웃을 마치지 못했습니다.', getApiErrorDetail(reason));
        });
    } finally {
      await signOut();
      isLoggingOutRef.current = false;
    }
  }, [signOut]);
};

export default useLogout;
