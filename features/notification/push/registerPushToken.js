import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import apiClient, { isApiConfigured } from '../../../shared/api/client';
import { openNotificationSettings } from '../../../shared/utils/openNotificationSettings';

import { setupNotificationChannels } from './notificationChannels';
import {
  hasAnsweredNotificationPermission,
  saveFirstNotificationPermissionResult,
} from './notificationDeniedNotice';

// eas init 을 하면 app.json 의 extra.eas.projectId 에 들어간다
const getProjectId = () =>
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;

// 로그아웃할 때 계정에서 뗄 토큰. 앱을 켤 때마다 등록하므로 권한이 있으면 들고 있다
let registeredToken = null;

// 로그인 · 로그아웃이 빠르게 이어져도 서버에 마지막 상태가 남도록 등록 요청을 순서대로 보낸다
let registerQueue = Promise.resolve();

/**
 * 로그인 · 가입 뒤 알림 권한 화면(NotificationPermission)을 띄울지.
 * 이미 허용돼 있거나 이 기기에서 한 번 답했으면 띄우지 않는다. 로그아웃해도 기기 권한은 그대로라 다시 묻지 않는다
 */
export const shouldAskNotificationPermission = async () => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return false;

    return !(await hasAnsweredNotificationPermission());
  } catch (error) {
    // 확인하지 못하면 묻지 않고 넘어간다. 설정 화면에서 켤 수 있다
    console.warn('알림 권한을 확인하지 못했습니다.', error?.message ?? error);
    return false;
  }
};

/**
 * 알림 권한 창을 띄운다. 이미 허용돼 있으면 띄우지 않는다.
 * 권한 거절 · 시뮬레이터는 알림만 못 받을 뿐 앱 사용에는 문제가 없어서 false 로 넘긴다.
 */
export const requestNotificationPermission = async () => {
  // 안드로이드 13 이상은 채널이 있어야 권한 요청 창이 뜬다
  await setupNotificationChannels();

  // iOS 시뮬레이터는 푸시 토큰을 받을 수 없다
  if (Platform.OS === 'ios' && !Device.isDevice) return false;

  const { status: currentStatus } = await Notifications.getPermissionsAsync();

  // 처음부터 허용돼 있었으면(안드로이드 12 이하 등) 나중에 설정에서 꺼도 거절 안내는 하지 않는다
  if (currentStatus === 'granted') {
    void saveFirstNotificationPermissionResult(true);
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  const granted = status === 'granted';

  // 첫 권한 창에서 거절했으면 피드 홈에서 안내한다
  void saveFirstNotificationPermissionResult(granted);

  return granted;
};

/**
 * 꺼진 알림을 켤 때 (설정 화면 · 거절 안내 Toast).
 * 설정 앱의 알림 설정으로 보낸다.
 * 다만 iOS 에서 '다음에 할게요'로 권한 창을 한 번도 띄우지 않았으면 설정 앱에 알림 항목이 없어서 권한 창을 띄운다
 */
export const turnOnNotifications = async () => {
  const { status } = await Notifications.getPermissionsAsync();

  // 안드로이드는 권한 창을 띄운 적이 없어도 설정 앱에 알림 항목이 있어서 늘 설정 앱으로 보낸다
  if (Platform.OS !== 'ios' || status !== 'undetermined') {
    await openNotificationSettings();
    return;
  }

  if (await requestNotificationPermission()) {
    await registerPushToken();
  }
};

const registerPushTokenNow = async () => {
  if (!isApiConfigured) return null;

  await setupNotificationChannels();

  if (Platform.OS === 'ios' && !Device.isDevice) return null;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return null;

  const projectId = getProjectId();

  if (!projectId) {
    console.warn('EAS projectId가 없어 푸시 토큰을 받을 수 없습니다. eas init을 실행해주세요.');
    return null;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

  // 로그인했으면 그 계정, 하지 않았으면 계정 없는 기기로 등록된다 (apiClient 가 로그인 토큰을 붙인다)
  await apiClient.post('/notification/push-token', {
    token,
    platform: Platform.OS,
  });

  registeredToken = token;

  return token;
};

/**
 * 알림 권한이 있으면 Expo 푸시 토큰을 서버에 등록한다. 권한은 묻지 않는다 (requestNotificationPermission).
 * 로그인하지 않았어도 등록해서 공지 푸시를 받는다. 로그인하면 다시 불러서 토큰 주인을 계정으로 바꾼다.
 * 토큰은 앱을 다시 설치하거나 기기를 바꾸면 달라질 수 있어서 앱을 켤 때마다 등록한다. (서버는 upsert)
 */
export const registerPushToken = () => {
  const request = registerQueue.then(registerPushTokenNow);
  registerQueue = request.catch(() => {});

  return request;
};

/**
 * 로그아웃할 때 이 기기 토큰을 계정에서 뗀다. 그래야 로그아웃한 기기로 그 계정 알림이 오지 않는다.
 * 토큰은 서버에 남아서 공지 푸시는 계속 받는다. 로그인 토큰이 필요해서 signOut 전에 불러야 한다.
 */
export const detachPushToken = async config => {
  const token = registeredToken;
  if (!token) return;

  registeredToken = null;

  await apiClient.delete('/notification/push-token', { ...config, data: { token } });
};
