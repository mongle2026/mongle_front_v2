import { useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

import { useGlobalOverlay } from '../../../../shared/providers/GlobalOverlayProvider';
import { useFloatingBottomOffset } from '../../../../shared/hooks/useFloatingBottomOffset';
import { colors } from '../../../../shared/styles/color';
import {
  completeNotificationDeniedNotice,
  restoreNotificationDeniedNotice,
  useIsNotificationDeniedNoticePending,
} from '../../../notification/push/notificationDeniedNotice';
import { turnOnNotifications } from '../../../notification/push/registerPushToken';

/**
 * 첫 알림 권한 창에서 거절했으면 피드 홈에서 Toast로 한 번 알린다.
 * - 다른 화면(가입 완료 등)에서 거절했으면 피드 홈에 들어올 때 띄운다
 * - 피드 홈 위에서 거절했으면 권한 창이 닫힌 뒤 띄운다
 * 그 사이 설정 앱에서 허용했으면 안내하지 않는다.
 *
 * @param {boolean} [enabled] false 면 true 가 될 때까지 미룬다 (코치마크가 떠 있을 때 등)
 */
const useNotificationDeniedToast = ({ enabled = true } = {}) => {
  const { showToast } = useGlobalOverlay();
  const bottomOffset = useFloatingBottomOffset();
  const isFocused = useIsFocused();
  const isPending = useIsNotificationDeniedNoticePending();

  // 거절하고 앱을 껐다 켠 경우를 위해 저장된 값을 읽는다
  useEffect(() => {
    void restoreNotificationDeniedNotice();
  }, []);

  useEffect(() => {
    if (!enabled || !isFocused || !isPending) return undefined;

    let isActive = true;

    const showNotice = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      // 확인하는 사이 다른 화면으로 넘어갔으면 다음에 들어올 때 띄운다
      if (!isActive) return;

      void completeNotificationDeniedNotice();
      if (status === 'granted') return;

      showToast({
        message: '알림은 언제든 다시 켤 수 있어요.',
        icon: 'info',
        iconColor: colors.fgInfoInverted,
        buttonText: '설정',
        onPressButton: turnOnNotifications,
        bottomOffset,
      });
    };

    void showNotice();

    return () => {
      isActive = false;
    };
  }, [bottomOffset, enabled, isFocused, isPending, showToast]);
};

export default useNotificationDeniedToast;
