import {
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
  SANCTION_NOTICE,
} from '../constants';
import {
  REPORT_RESULT_TYPE,
  toReportTargetType,
} from '../../report/constants';

// 운영정책 안내의 제재 내용별 결과 화면. 영구 정지는 상세 화면이 없다
const SANCTION_RESULT_TYPE = {
  [SANCTION_NOTICE.WARNING]: REPORT_RESULT_TYPE.WARNING,
  [SANCTION_NOTICE.SUSPENSION]: REPORT_RESULT_TYPE.SUSPENDED,
};

/*
 * 신고 · 제재 소식 알림의 결과 화면(ReportResult).
 * 화면에 쓸 값(신고 사유 · sanctionId 등)은 알림 목록 항목에만 있고 푸시 data 에는 없어서,
 * 푸시를 누르면 null 이 되어 알림 목록으로 간다. 값이 없는 예전 알림도 이동하지 않는다.
 * 이의 신청 결과 알림(appeal_accepted · appeal_rejected)은 상세 화면이 없다
 */
const getReportResultRoute = notification => {
  switch (notification.status) {
    // 신고 검토 결과: 알림에 복사해 둔 값을 그대로 넘긴다. 처리한 시각은 알림이 온 시각이다
    case NOTIFICATION_STATUS.REPORT_RESOLVED:
    case NOTIFICATION_STATUS.REPORT_REJECTED:
      if (!notification.reportReason) return null;

      return {
        name: 'ReportResult',
        params: {
          resultType:
            notification.status === NOTIFICATION_STATUS.REPORT_RESOLVED
              ? REPORT_RESULT_TYPE.VIOLATION
              : REPORT_RESULT_TYPE.NO_VIOLATION,
          targetType: toReportTargetType(notification.targetType),
          userCode: notification.targetUserCode,
          profileImageUrl: notification.targetProfileImageUrl,
          preview: notification.targetPreview,
          reportReason: notification.reportReason,
          reportedAt: notification.reportedAt,
          handledAt: notification.createdAt,
        },
      };

    // 운영정책 안내 (경고 1회 · 경고 2회). 내용은 결과 화면이 sanctionId 로 받는다
    case NOTIFICATION_STATUS.POLICY_NOTICE: {
      const resultType = SANCTION_RESULT_TYPE[notification.sanction];
      if (!resultType || !notification.sanctionId) return null;

      return {
        name: 'ReportResult',
        params: { resultType, sanctionId: notification.sanctionId },
      };
    }

    // 이용 정지 해제 안내 (정지 기간이 끝남)
    case NOTIFICATION_STATUS.RESTRICTION_EXPIRED:
      if (!notification.sanctionId) return null;

      return {
        name: 'ReportResult',
        params: {
          resultType: REPORT_RESULT_TYPE.SUSPENSION_LIFTED,
          sanctionId: notification.sanctionId,
        },
      };

    default:
      return null;
  }
};

/**
 * 알림을 눌렀을 때 이동할 화면.
 * 알림 목록의 항목과 푸시 알림의 data 모두 { type, status, letterId, feedId, commentId, actorPublicId } 를 갖고 있다.
 * 신고 · 제재 소식 알림은 목록 항목에만 있는 값으로 결과 화면에 간다 (getReportResultRoute)
 *
 * 원본(편지/피드)이 지워졌으면 이동한 화면에서 "찾을 수 없음" Dialog를 띄우고,
 * 피드는 남아 있고 댓글/답글만 지워졌으면 피드 상세에서 Toast로 알린다.
 */
export const getNotificationRoute = notification => {
  const type = notification?.type;

  if (type === NOTIFICATION_TYPE.NEWS) {
    return getReportResultRoute(notification);
  }

  if (type === NOTIFICATION_TYPE.LETTER && notification.letterId) {
    return {
      name: 'LetterDetail',
      params: { letterId: notification.letterId },
    };
  }

  // 팔로우: 나를 팔로우한 사람 프로필. 탈퇴한 회원은 프로필이 없다
  if (
    notification?.status === NOTIFICATION_STATUS.FOLLOW &&
    notification.actorPublicId &&
    !notification.isActorWithdrawn
  ) {
    return {
      name: 'UserProfile',
      params: { userId: notification.actorPublicId },
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
