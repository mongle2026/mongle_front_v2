import { useEffect, useState } from 'react';

import {
  registerPushToken,
  requestNotificationPermission,
  shouldAskNotificationPermission,
} from '../../../notification/push/registerPushToken';

/**
 * 온보딩에서 로그인 없이 이용하기로 들어왔으면 피드 홈에서 OS 알림 권한 창을 바로 띄운다.
 * 허용하면 푸시 토큰을 등록하고, 거절하면 거절 안내 Toast 가 남는다 (useNotificationDeniedToast).
 * 이 기기에서 이미 답했거나 허용돼 있으면 띄우지 않는다
 *
 * params: { requestNotificationPermission } 온보딩이 넘긴다. 한 번 묻고 지운다
 *
 * @returns {boolean} 권한을 묻는 중인지. 코치마크 · Toast 는 끝날 때까지 미룬다
 */
const useBrowseNotificationPermission = ({ navigation, route }) => {
  const shouldRequest = route.params?.requestNotificationPermission === true;
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (!shouldRequest) return;

    setIsRequesting(true);
    // 탭을 다시 눌러 들어와도 또 묻지 않게 지운다
    navigation.setParams({ requestNotificationPermission: undefined });

    const request = async () => {
      try {
        if ((await shouldAskNotificationPermission()) && (await requestNotificationPermission())) {
          await registerPushToken();
        }
      } catch (error) {
        console.warn('알림 권한을 요청하지 못했습니다.', error?.message ?? error);
      } finally {
        setIsRequesting(false);
      }
    };

    void request();
  }, [navigation, shouldRequest]);

  // params 를 지우기 전 첫 렌더에도 묻는 중으로 본다
  return shouldRequest || isRequesting;
};

export default useBrowseNotificationPermission;
