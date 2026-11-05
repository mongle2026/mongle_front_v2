import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';

import apiClient, { getApiErrorDetail } from '../../../../shared/api/client';
import { useAuthStore } from '../../../../shared/auth/useAuthStore';

/**
 * 제재 화면에 있는 동안 이용 제한 상태를 다시 확인한다. GET /appeal/restriction
 *
 * - 앱으로 돌아올 때 (이의 신청 결과 푸시를 눌러서 들어온 경우 포함)
 * - 앱을 보고 있는 중에 푸시를 받을 때
 *
 * 제한이 풀렸으면(이의 신청 받아들임 · 기간 끝남) restriction 을 지워서 앱으로 들여보내고,
 * 아직 제한 중이면 이의 신청 상태(기각되면 다시 신청할 수 있다)를 바꾼다.
 */
const useRestrictionRecheck = () => {
  const setRestriction = useAuthStore(state => state.setRestriction);

  useEffect(() => {
    const recheck = async () => {
      try {
        const { data } = await apiClient.get('/appeal/restriction');

        // 그 사이 로그아웃했으면 건드리지 않는다
        if (!useAuthStore.getState().restriction) return;

        setRestriction(
          data?.isRestricted
            ? {
                reason: data.reason ?? null,
                restrictedUntil: data.restrictedUntil ?? null,
                appealStatus: data.appealStatus ?? null,
              }
            : null,
        );
      } catch (error) {
        console.warn('이용 제한 상태를 확인하지 못했습니다.', getApiErrorDetail(error));
      }
    };

    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') void recheck();
    });

    const pushSubscription = Notifications.addNotificationReceivedListener(() => {
      void recheck();
    });

    return () => {
      appStateSubscription.remove();
      pushSubscription.remove();
    };
  }, [setRestriction]);
};

export default useRestrictionRecheck;
