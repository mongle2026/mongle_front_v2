import {
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
} from '../components/NotificationListItem';

/**
 * 알림을 눌렀을 때 이동할 화면.
 * 알림 목록의 항목과 푸시 알림의 data 모두 { type, status, letterId, feedId, commentId } 를 갖고 있다.
 *
 * 원본(편지/피드)이 지워졌으면 이동한 화면에서 "찾을 수 없음" Dialog를 띄우고,
 * 피드는 남아 있고 댓글/답글만 지워졌으면 피드 상세에서 Toast로 알린다.
 */
export const getNotificationRoute = notification => {
  const type = notification?.type;

  if (type === NOTIFICATION_TYPE.LETTER && notification.letterId) {
    return {
      name: 'LetterDetail',
      params: { letterId: notification.letterId },
    };
  }

  if (type === NOTIFICATION_TYPE.FEED && notification.feedId) {
    return {
      name: 'FeedDetail',
      params: {
        feedId: String(notification.feedId),
        scrollToComment: true,
        commentId: notification.commentId ?? null,
        isReply: notification.status === NOTIFICATION_STATUS.REPLY,
      },
    };
  }

  return null;
};
