import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { isApiConfigured } from '../../../shared/api/client';
import { useAuthStore } from '../../../shared/auth/useAuthStore';
import { hasId } from '../../../shared/utils/id';
import { notificationKeys } from '../api/notificationKeys';
import { checkNotifications } from '../api/notificationCheck';

/*
 * 알림 화면을 나가면(언마운트) 지금까지 온 알림을 모두 확인한 것으로 서버에 남긴다.
 * 알림마다 읽음을 따지지 않는다. 알림을 눌러 다른 화면으로 가는 건 아직 나간 게 아니다.
 * 돌아간 화면에서 레드닷이 깜빡이지 않게 응답을 기다리지 않고 먼저 지운다.
 */
const useCheckNotificationsOnLeave = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore(state => state.session?.userId ?? null);

  useEffect(() => {
    if (!isApiConfigured || !hasId(userId)) return undefined;

    return () => {
      const unreadKey = notificationKeys.unread(userId);

      // 나가기 전에 시작된 조회가 늦게 와서 레드닷을 다시 켜지 않게 취소한다
      void queryClient.cancelQueries({ queryKey: unreadKey });
      queryClient.setQueryData(unreadKey, false);

      checkNotifications().catch(error => {
        console.warn('알림 확인을 저장하지 못했습니다.', error?.message ?? error);
      });
    };
  }, [queryClient, userId]);
};

export default useCheckNotificationsOnLeave;
