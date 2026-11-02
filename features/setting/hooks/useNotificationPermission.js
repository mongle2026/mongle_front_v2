import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';

// 기기 알림 권한 허용 여부
// 설정 앱에서 권한을 바꾸고 돌아올 수 있어서 앱이 다시 활성화될 때마다 권한을 확인한다
const useNotificationPermission = () => {
  const [isGranted, setIsGranted] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setIsGranted(status === 'granted');
    };

    checkPermission();

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') checkPermission();
    });

    return () => subscription.remove();
  }, []);

  return isGranted;
};

export default useNotificationPermission;
