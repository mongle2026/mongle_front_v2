import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { isApiConfigured } from '../../../shared/api/client';
import { useAuthStore } from '../../../shared/auth/useAuthStore';
import { hasId } from '../../../shared/utils/id';
import { notificationKeys } from '../api/notificationKeys';
import { fetchHasUnreadNotification } from '../api/notificationCheck';

/*
 * 종 아이콘 레드닷 표시 여부. 알림 화면을 마지막으로 나간 뒤에 새 알림이 오면 true.
 * 로그인하지 않았으면 조회하지 않고 false.
 * 푸시 없이 목록에만 쌓이는 알림(야간 등)도 잡도록 화면에 돌아올 때와 앱이 다시 활성화될 때 다시 조회한다.
 */
const useHasUnreadNotification = () => {
  const userId = useAuthStore(state => state.session?.userId ?? null);
  const isConfigured = Boolean(isApiConfigured && hasId(userId));

  const { data: hasUnread = false, refetch } = useQuery({
    queryKey: notificationKeys.unread(userId),
    enabled: isConfigured,
    queryFn: fetchHasUnreadNotification,
  });

  // 이미 조회 중이면 새로 보내지 않는다
  const refetchUnread = useCallback(() => {
    if (isConfigured) refetch({ cancelRefetch: false });
  }, [isConfigured, refetch]);

  useFocusEffect(refetchUnread);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') refetchUnread();
    });

    return () => subscription.remove();
  }, [refetchUnread]);

  return isConfigured && hasUnread;
};

export default useHasUnreadNotification;
