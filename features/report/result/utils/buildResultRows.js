import { formatDate } from '../../../../shared/utils/dateUtils';

import {
  getReportReasonLabel,
  REPORT_ACTION_LABEL,
  REPORT_RESULT_TYPE,
  REPORT_TARGET_TYPE,
  toReportTargetType,
} from '../../constants';

const NO_ACTION_LABEL = '조치 없음';
const SUSPENSION_REASON_LABEL = '경고 2회 누적';

// 누적 경고 문구. 경고 1회 화면은 1회, 경고 2회 · 이용 정지 해제 화면은 2회로 정해져 있다
const WARNING_COUNT_LABEL = {
  1: '1회 (6개월 뒤 소멸)',
  2: '2회 (1회 더 받으면 영구 정지)',
};

// 백엔드 ReportTargetType('FEED' 등) → '피드 가림' 등
const getActionLabel = targetType =>
  REPORT_ACTION_LABEL[toReportTargetType(targetType)] ?? '';

const formatPeriod = (start, end) => `${formatDate(start)} ~ ${formatDate(end)}`;

/**
 * 신고 검토 결과(신고한 사람) 요약 박스. 값은 알림 목록 항목에 복사돼 있다
 * targetType: REPORT_TARGET_TYPE, reportReason: 백엔드 ReportReason,
 * reportedAt: 신고한 시각, handledAt: 처리한 시각(알림이 온 시각)
 */
export const buildReportReviewRows = ({
  resultType,
  targetType,
  reportReason,
  reportedAt,
  handledAt,
}) => [
  { label: '신고 사유', value: getReportReasonLabel(reportReason) },
  { label: '신고 일자', value: formatDate(reportedAt) },
  { label: '처리 일자', value: formatDate(handledAt) },
  {
    label: '처리 결과',
    value:
      resultType === REPORT_RESULT_TYPE.VIOLATION
        ? REPORT_ACTION_LABEL[targetType] ?? ''
        : NO_ACTION_LABEL,
  },
];

// 경고 내역: 1회차(yy.mm.dd · 댓글 삭제) ...
const buildHistoryRows = warnings =>
  (warnings ?? []).map((warning, index) => ({
    label: `${index + 1}회차`,
    value: `${formatDate(warning.warnedAt)} · ${getActionLabel(warning.targetType)}`,
  }));

/**
 * 운영정책 안내(경고 1회 · 2회) · 이용 정지 해제 안내의 요약 박스와 경고 내역.
 * sanction: GET /sanction/:sanctionId 응답 (useSanctionDetail)
 */
export const buildSanctionRows = (resultType, sanction) => {
  if (!sanction) return { summaryRows: [], historyRows: [] };

  const reasonLabel = getReportReasonLabel(sanction.reason);
  const actionLabel = getActionLabel(sanction.targetType);
  // 계정 신고는 가리거나 지울 콘텐츠가 없어 조치 내용에 대상 문구 대신 경고 횟수를 적는다
  const isUserTarget =
    toReportTargetType(sanction.targetType) === REPORT_TARGET_TYPE.USER;
  const suspensionPeriod = formatPeriod(
    sanction.restrictedAt,
    sanction.restrictedUntil,
  );

  switch (resultType) {
    case REPORT_RESULT_TYPE.WARNING:
      return {
        summaryRows: [
          { label: '위반 사유', value: reasonLabel },
          {
            label: '조치 내용',
            value: isUserTarget ? '경고 1회' : `${actionLabel} · 경고 1회`,
          },
          { label: '조치 일자', value: formatDate(sanction.sanctionedAt) },
          { label: '누적 경고', value: WARNING_COUNT_LABEL[1] },
        ],
        historyRows: [],
      };

    case REPORT_RESULT_TYPE.SUSPENDED:
      return {
        summaryRows: [
          { label: '위반 사유', value: reasonLabel },
          {
            label: '조치 내용',
            value: isUserTarget
              ? '경고 2회 · 7일 이용 정지'
              : `${actionLabel} · 7일 이용 정지`,
          },
          { label: '조치 일자', value: suspensionPeriod },
          { label: '누적 경고', value: WARNING_COUNT_LABEL[2] },
        ],
        historyRows: buildHistoryRows(sanction.warnings),
      };

    case REPORT_RESULT_TYPE.SUSPENSION_LIFTED:
      return {
        summaryRows: [
          { label: '정지 사유', value: SUSPENSION_REASON_LABEL },
          { label: '정지 기간', value: suspensionPeriod },
          // 기간이 끝나서 풀린 안내라 정지가 끝난 시각이 해제 일자다
          { label: '해제 일자', value: formatDate(sanction.restrictedUntil) },
          { label: '누적 경고', value: WARNING_COUNT_LABEL[2] },
        ],
        historyRows: buildHistoryRows(sanction.warnings),
      };

    default:
      return { summaryRows: [], historyRows: [] };
  }
};
