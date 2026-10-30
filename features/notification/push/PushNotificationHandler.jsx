import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '../../../shared/auth/useAuthStore';
import { notificationKeys } from '../api/notificationKeys';
import { getNotificationRoute } from '../utils/getNotificationRoute';
import { registerPushToken, requestNotificationPermission } from './registerPushToken';
import { hasId } from '../../../shared/utils/id';

// 앱을 보고 있는 중에 온 알림도 배너로 띄운다
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * 푸시 알림 연결. 화면은 그리지 않는다.
 * - 앱을 켜거나 로그인 · 로그아웃하면 푸시 토큰 등록 (로그인하지 않았으면 계정 없는 기기로, 공지만 받는다)
 * - 알림이 오면 알림 목록 갱신
 * - 알림을 누르면 해당 화면으로 이동 (앱이 꺼져 있다가 알림으로 켜진 경우 포함)
 *
 * navigationRef 는 NavigationContainer 가 준비된 뒤(isNavigationReady)에만 쓴다.
 */
const PushNotificationHandler = ({ navigationRef, isNavigationReady }) => {
  const queryClient = useQueryClient();
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledNotificationIdRef = useRef(null);

  // 로그인 · 로그아웃 · 다른 계정으로 로그인하면 서버가 이 기기 토큰의 주인을 바꾼다
  const userId = useAuthStore(state => state.session?.userId ?? null);

  useEffect(() => {
    // TODO: 알림 온보딩 화면이 생기면 권한은 거기서 묻고 여기서는 등록만 한다
    requestNotificationPermission()
      .then(registerPushToken)
      .catch(error => {
        console.warn('푸시 토큰을 등록하지 못했습니다.', error?.message ?? error);
      });
  }, [userId]);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });

    return () => subscription.remove();
  }, [queryClient]);

  useEffect(() => {
    if (!isNavigationReady || !lastResponse) return;
    if (lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const { identifier, content } = lastResponse.notification.request;
    if (handledNotificationIdRef.current === identifier) return;

    handledNotificationIdRef.current = identifier;
    // 앱을 다시 불러와도 같은 알림으로 또 이동하지 않게 지운다
    Notifications.clearLastNotificationResponse();

    // 로그인하지 않은 기기는 공지 푸시만 받고 알림 목록이 없어서 앱만 연다
    if (!hasId(userId)) return;

    queryClient.invalidateQueries({ queryKey: notificationKeys.all });

    // 이동할 원본이 없는 알림(소식)은 알림 목록으로 보낸다
    const route = getNotificationRoute(content.data) ?? { name: 'Notification' };
    navigationRef.navigate(route.name, route.params);
  }, [isNavigationReady, lastResponse, navigationRef, queryClient, userId]);

  return null;
};

export default PushNotificationHandler;
