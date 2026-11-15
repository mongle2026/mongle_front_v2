import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';

import apiClient, { getApiErrorDetail } from '../../../../../shared/api/client';
import {
  AUTH_STATUS,
  useAuthStore,
} from '../../../../../shared/auth/useAuthStore';

/**
 * 아직 확인하지 않은 이용 제한 해제 안내가 있는지 확인한다. GET /sanction/restriction-lift
 * 있으면 useAuthStore.restrictionLifted 를 채워서 App 이 해제 안내 화면(RestrictionLiftedScreen)을 띄운다.
 * 제한이 풀린 뒤 앱에 처음 들어올 때 한 번 보여주려고, 앱을 꺼 둔 사이 풀린 경우도 여기서 알게 된다
 *
 * - 로그인할 때 · 앱을 켤 때 · 이용 제한이 풀렸을 때
 * - 앱으로 돌아올 때
 * - 앱을 보고 있는 중에 푸시를 받을 때 (이의 신청 결과 푸시)
 *
 * 이용 제한 중이면 제재 화면이 떠 있어서 확인하지 않는다 (서버도 403 ACCOUNT_RESTRICTED 로 막는다)
 */
const useRestrictionLiftCheck = () => {
  const userId = useAuthStore(state =>
    state.status === AUTH_STATUS.SIGNED_IN ? state.session?.userId : null,
  );
  const isRestricted = useAuthStore(state => state.restriction !== null);
  const setRestrictionLifted = useAuthStore(
    state => state.setRestrictionLifted,
  );

  useEffect(() => {
    if (userId == null || isRestricted) return undefined;

    const check = async () => {
      try {
        const { data } = await apiClient.get('/sanction/restriction-lift');

        // 그 사이 로그아웃 · 다른 계정으로 로그인했으면 건드리지 않는다
        if (useAuthStore.getState().session?.userId !== userId) return;

        setRestrictionLifted(
          data?.restrictionLift
            ? { reason: data.restrictionLift.reason ?? null }
            : null,
        );
      } catch (error) {
        console.warn(
          '이용 제한 해제 안내를 확인하지 못했습니다.',
          getApiErrorDetail(error),
        );
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
  }, [userId, isRestricted, setRestrictionLifted]);
};

export default useRestrictionLiftCheck;
