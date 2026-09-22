import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import apiClient, { isApiConfigured } from '../../../shared/api/client';

import { setupNotificationChannels } from './notificationChannels';

// eas init 을 하면 app.json 의 extra.eas.projectId 에 들어간다
const getProjectId = () =>
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;

const requestPermission = async () => {
  const { status: currentStatus } = await Notifications.getPermissionsAsync();
  if (currentStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

/**
 * 알림 권한을 받고 Expo 푸시 토큰을 서버에 등록한다.
 * 토큰은 앱을 다시 설치하거나 기기를 바꾸면 달라질 수 있어서 앱을 켤 때마다 등록한다. (서버는 upsert)
 *
 * 권한 거절 · 시뮬레이터 · projectId 없음은 알림만 못 받을 뿐 앱 사용에는 문제가 없어서 조용히 넘긴다.
 */
export const registerPushToken = async userId => {
  if (!isApiConfigured || !(Number(userId) > 0)) return null;

  // 안드로이드 13 이상은 채널이 있어야 권한 요청 창이 뜬다
  await setupNotificationChannels();

  // iOS 시뮬레이터는 푸시 토큰을 받을 수 없다
  if (Platform.OS === 'ios' && !Device.isDevice) return null;

  const granted = await requestPermission();
  if (!granted) return null;

  const projectId = getProjectId();

  if (!projectId) {
    console.warn('EAS projectId가 없어 푸시 토큰을 받을 수 없습니다. eas init을 실행해주세요.');
    return null;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

  await apiClient.post('/notification/push-token', {
    userId: Number(userId),
    token,
    platform: Platform.OS,
  });

  return token;
};
