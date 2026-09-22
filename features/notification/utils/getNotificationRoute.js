import { NOTIFICATION_TYPE } from '../components/NotificationListItem';

/**
 * 알림을 눌렀을 때 이동할 화면.
 * 알림 목록의 항목과 푸시 알림의 data 모두 { type, letterId, feedId } 를 갖고 있다.
 *
 * 원본(편지/댓글)이 지워졌으면 이동한 화면에서 "찾을 수 없음" 상태를 보여준다.
 */
export const getNotificationRoute = notification => {
  const type = notification?.type;

  if (type === NOTIFICATION_TYPE.LETTER && notification.letterId) {
    return {
      name: 'LetterDetail',
      params: { letterId: Number(notification.letterId) },
    };
  }

  if (type === NOTIFICATION_TYPE.FEED && notification.feedId) {
    return {
      name: 'FeedDetail',
      params: {
        feedId: String(notification.feedId),
        scrollToComment: true,
      },
    };
  }

  return null;
};
