import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import apiClient, { getApiErrorDetail, isApiConfigured } from '../../../shared/api/client';
import { useAuthStore } from '../../../shared/auth/useAuthStore';
import { hasId } from '../../../shared/utils/id';
import { notificationKeys } from '../../notification/api/notificationKeys';

// 알림 설정 key. 백엔드 NotificationSettingKey 와 같다
export const NOTIFICATION_SETTING_KEY = {
  FOLLOW: 'follow',
  COMMENT: 'comment',
  LETTER_SENT: 'letter_sent',
  LETTER_RECEIVED: 'letter_received',
  SYSTEM: 'system',
  EVENT: 'event',
  NIGHT: 'night',
};

// 서버 값을 받기 전에 보여줄 값. 백엔드 NOTIFICATION_SETTING_DEFAULTS 와 같다 (이벤트는 광고성 정보라 기본 OFF)
const DEFAULT_SETTINGS = {
  [NOTIFICATION_SETTING_KEY.FOLLOW]: true,
  [NOTIFICATION_SETTING_KEY.COMMENT]: true,
  [NOTIFICATION_SETTING_KEY.LETTER_SENT]: true,
  [NOTIFICATION_SETTING_KEY.LETTER_RECEIVED]: true,
  [NOTIFICATION_SETTING_KEY.SYSTEM]: true,
  [NOTIFICATION_SETTING_KEY.EVENT]: false,
  [NOTIFICATION_SETTING_KEY.NIGHT]: true,
};

const SETTINGS_STALE_TIME = 5 * 60 * 1000;

// 서버 응답 [{ key, enabled, updatedAt }] → { [key]: enabled }
const toSettingMap = rows => Object.fromEntries(rows.map(({ key, enabled }) => [key, enabled]));

/*
 * 알림 설정 조회 / 변경. 설정 화면과 알림 설정 화면이 같은 캐시를 쓴다.
 * 토글은 화면을 먼저 바꾸고 요청을 보낸다. 요청은 순서대로 하나씩 보내서(scope) 연타해도 마지막 값이 남는다.
 * 실패하면 서버 값을 다시 받아 되돌린다.
 */
export default function useNotificationSettings() {
  const queryClient = useQueryClient();
  const userId = useAuthStore(state => state.session?.userId ?? null);
  const queryKey = notificationKeys.settings(userId);

  const { data } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await apiClient.get('/notification/settings');

      return toSettingMap(response.data);
    },
    enabled: isApiConfigured && hasId(userId),
    staleTime: SETTINGS_STALE_TIME,
  });

  const settings = useMemo(() => ({ ...DEFAULT_SETTINGS, ...data }), [data]);

  const { mutate } = useMutation({
    mutationKey: queryKey,
    scope: { id: 'notification-settings' },

    // changes: { [key]: enabled }
    mutationFn: async changes => {
      const response = await apiClient.patch('/notification/settings', {
        settings: Object.entries(changes).map(([key, enabled]) => ({ key, enabled })),
      });

      return response.data;
    },

    onMutate: async changes => {
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData(queryKey, prev => ({ ...DEFAULT_SETTINGS, ...prev, ...changes }));
    },

    onError: error => {
      console.warn('알림 설정을 바꾸지 못했습니다.', getApiErrorDetail(error));
    },

    // 뒤에 보낼 요청이 남아 있으면 그 요청이 끝난 뒤에 한 번만 다시 받는다
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: queryKey }) === 1) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  // 값이 바뀌는 key 만 보낸다. 이벤트 동의 시각(updatedAt)이 바뀌지 않은 설정에서 갱신되지 않게 한다
  const updateSettings = useCallback(
    nextValues => {
      const changes = Object.fromEntries(
        Object.entries(nextValues).filter(([key, enabled]) => settings[key] !== enabled),
      );

      if (Object.keys(changes).length === 0) return;

      mutate(changes);
    },
    [mutate, settings],
  );

  return { settings, updateSettings };
}
