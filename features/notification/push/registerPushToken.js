import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import apiClient, { isApiConfigured } from '../../../shared/api/client';

import { setupNotificationChannels } from './notificationChannels';
import { hasId } from '../../../shared/utils/id';

// eas init 을 하면 app.json 의 extra.eas.projectId 에 들어간다
const getProjectId = () =>
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;

// 로그아웃할 때 서버에서 지울 토큰. 앱을 켤 때마다 등록하므로 로그인해 있으면 들고 있다
let registeredToken = null;

const requestPermission = async () => {
  const { status: currentStatus } = await Notifications.getPermissionsAsync();
  if (currentStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

/**
 * 알림 권한을 받고 Expo 푸시 토큰을 로그인한 계정으로 서버에 등록한다.
 * 토큰은 앱을 다시 설치하거나 기기를 바꾸면 달라질 수 있어서 앱을 켤 때마다 등록한다. (서버는 upsert)
 *
 * 권한 거절 · 시뮬레이터 · projectId 없음은 알림만 못 받을 뿐 앱 사용에는 문제가 없어서 조용히 넘긴다.
 */
export const registerPushToken = async userId => {
  if (!isApiConfigured || !hasId(userId)) return null;

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
    token,
    platform: Platform.OS,
  });

  registeredToken = token;

  return token;
};

/**
 * 로그아웃할 때 이 기기 토큰을 계정에서 뗀다. 그래야 로그아웃한 기기로 그 계정 알림이 오지 않는다.
 * 로그인 토큰이 필요해서 signOut 전에 불러야 한다.
 */
export const unregisterPushToken = async config => {
  const token = registeredToken;
  if (!token) return;

  registeredToken = null;

  await apiClient.delete('/notification/push-token', { ...config, data: { token } });
};
