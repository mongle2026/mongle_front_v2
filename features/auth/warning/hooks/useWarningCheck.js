import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';

import apiClient, { getApiErrorDetail } from '../../../../shared/api/client';
import {
  AUTH_STATUS,
  useAuthStore,
} from '../../../../shared/auth/useAuthStore';

/**
 * 아직 확인하지 않은 경고 1회가 있는지 확인한다. GET /sanction/warning
 * 있으면 useAuthStore.warning 을 채워서 App 이 경고 안내 화면(WarningNoticeScreen)을 띄운다
 *
 * - 로그인할 때 · 앱을 켤 때 · 이용 제한이 풀렸을 때
 * - 앱으로 돌아올 때
 * - 앱을 보고 있는 중에 푸시를 받을 때 (운영정책 안내 푸시)
 *
 * 이용 제한 중이면 제재 화면이 대신 알려서 확인하지 않는다 (서버도 403 ACCOUNT_RESTRICTED 로 막는다)
 */
const useWarningCheck = () => {
  const userId = useAuthStore(state =>
    state.status === AUTH_STATUS.SIGNED_IN ? state.session?.userId : null,
  );
  const isRestricted = useAuthStore(state => state.restriction !== null);
  const setWarning = useAuthStore(state => state.setWarning);

  useEffect(() => {
    if (userId == null || isRestricted) return undefined;

    const check = async () => {
      try {
        const { data } = await apiClient.get('/sanction/warning');

        // 그 사이 로그아웃 · 다른 계정으로 로그인했으면 건드리지 않는다
        if (useAuthStore.getState().session?.userId !== userId) return;

        setWarning(data?.warning ? { reason: data.warning.reason ?? null } : null);
      } catch (error) {
        console.warn('경고 여부를 확인하지 못했습니다.', getApiErrorDetail(error));
      }
    };

    void check();

    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') void check();
    });

    const pushSubscription = Notifications.addNotificationReceivedListener(() => {
      void check();
    });

    return () => {
      appStateSubscription.remove();
      pushSubscription.remove();
    };
  }, [userId, isRestricted, setWarning]);
};

export default useWarningCheck;
