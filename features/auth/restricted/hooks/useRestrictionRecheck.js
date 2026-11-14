import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';

import apiClient, { getApiErrorDetail } from '../../../../shared/api/client';
import { useAuthStore } from '../../../../shared/auth/useAuthStore';

/**
 * 제재 화면에 있는 동안 이용 제한 상태를 다시 확인한다. GET /sanction/restriction
 *
 * - 앱으로 돌아올 때 (이의 신청 결과 푸시를 눌러서 들어온 경우 포함)
 * - 앱을 보고 있는 중에 푸시를 받을 때
 *
 * 제한이 풀렸으면(이의 신청 받아들임 · 기간 끝남) restriction 을 지우고, 응답의 restrictionLift(해제 안내)로
 * restrictionLifted 를 채워서 홈으로 가기 전에 해제 안내 화면(RestrictionLiftedScreen)을 띄우고,
 * 아직 제한 중이면 이의 신청 상태(검토 중 → 기각 등)를 바꾼다.
 */
const useRestrictionRecheck = () => {
  const setRestriction = useAuthStore(state => state.setRestriction);
  const setRestrictionLifted = useAuthStore(
    state => state.setRestrictionLifted,
  );

  useEffect(() => {
    const recheck = async () => {
      try {
        const { data } = await apiClient.get('/sanction/restriction');

        // 그 사이 로그아웃했으면 건드리지 않는다
        if (!useAuthStore.getState().restriction) return;

        if (data?.isRestricted) {
          setRestriction({
            reason: data.reason ?? null,
            restrictedAt: data.restrictedAt ?? null,
            restrictedUntil: data.restrictedUntil ?? null,
            appealStatus: data.appealStatus ?? null,
          });
          return;
        }

        // restriction 보다 먼저 채워야 홈이 잠깐 보이지 않고 바로 해제 안내 화면으로 넘어간다
        setRestrictionLifted(
          data?.restrictionLift
            ? { reason: data.restrictionLift.reason ?? null }
            : null,
        );
        setRestriction(null);
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
  }, [setRestriction, setRestrictionLifted]);
};

export default useRestrictionRecheck;
