import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * 안드로이드 알림 채널. 알림 설정 항목과 1:1 이고, id 는 백엔드 NotificationSettingKey 와 같다.
 * 서버가 푸시를 보낼 때 channelId 로 이 id 를 넣으므로, 채널이 없으면 알림이 표시되지 않는다.
 *
 * 채널의 중요도(소리 · 팝업)는 한 번 만들어지면 앱에서 바꿀 수 없다.
 * 바꿔야 하면 새 id 로 채널을 만들고 백엔드 channelId 도 함께 바꿔야 한다.
 */
const NOTIFICATION_CHANNELS = [
  { id: 'comment', name: '댓글 알림' },
  { id: 'letter_sent', name: '편지 전송 알림' },
  { id: 'letter_received', name: '편지 도착 알림' },
  { id: 'system', name: '시스템 알림' },
  { id: 'event', name: '이벤트 알림' },
];

export const setupNotificationChannels = async () => {
  if (Platform.OS !== 'android') return;

  await Promise.all(
    NOTIFICATION_CHANNELS.map(channel =>
      Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        importance: Notifications.AndroidImportance.HIGH,
      }),
    ),
  );
};
