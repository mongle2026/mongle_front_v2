import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';

// 안드로이드는 앱 알림 설정 화면으로 바로 보내고, 안 되면(iOS 포함) 앱 설정 화면으로 보낸다
export const openNotificationSettings = async () => {
  const packageName = Constants.expoConfig?.android?.package;

  if (Platform.OS === 'android' && packageName) {
    try {
      await Linking.sendIntent('android.settings.APP_NOTIFICATION_SETTINGS', [
        { key: 'android.provider.extra.APP_PACKAGE', value: packageName },
      ]);
      return;
    } catch {
      // 알림 설정 인텐트를 지원하지 않는 기기는 앱 설정 화면으로 보낸다
    }
  }

  await Linking.openSettings();
};
