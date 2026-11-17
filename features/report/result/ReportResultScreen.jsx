import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import IcArrowLeft from '../../../assets/icons/ic_arrow_left.svg';

import TopSubNavigation from '../../../shared/components/navigation/topnavigation/TopSubNavigation';
import PolicyLinks from '../../../shared/components/content/PolicyLinks';
import { getApiErrorDetail } from '../../../shared/api/client';

import { colors } from '../../../shared/styles/color';
import { gap, padding, radius } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';

import TargetCard from '../components/TargetCard';
import {
  OWN_TARGET_TYPES,
  REPORT_RESULT_TYPE,
  REPORT_TARGET_TYPE,
  TARGET_CARD_VARIANT,
  toReportTargetType,
} from '../constants';
import useSanctionDetail from './hooks/useSanctionDetail';
import {
  buildReportReviewRows,
  buildSanctionRows,
} from './utils/buildResultRows';

const HEADER_TEXT = {
  [REPORT_RESULT_TYPE.VIOLATION]: '신고 검토 결과',
  [REPORT_RESULT_TYPE.NO_VIOLATION]: '신고 검토 결과',
  [REPORT_RESULT_TYPE.WARNING]: '운영정책 안내',
  [REPORT_RESULT_TYPE.SUSPENDED]: '운영정책 안내',
  [REPORT_RESULT_TYPE.SUSPENSION_LIFTED]: '이용 정지 해제 안내',
};

// 경고 1회: 신고 대상 종류별 제목
const WARNING_TITLE = {
  [REPORT_TARGET_TYPE.COMMENT]: '작성하신 댓글이 삭제됐어요',
  [REPORT_TARGET_TYPE.FEED]: '작성하신 피드가 가려졌어요',
  [REPORT_TARGET_TYPE.LETTER]: '보내신 편지가 삭제됐어요',
  [REPORT_TARGET_TYPE.USER]: '계정이 제한됐어요',
};

// 경고 2회: 설명 앞에 붙는 신고 대상 문구. 사용자 신고는 붙이지 않는다
const SUSPENDED_TARGET_PREFIX = {
  [REPORT_TARGET_TYPE.COMMENT]: '이 댓글로 ',
  [REPORT_TARGET_TYPE.FEED]: '이 피드로 ',
  [REPORT_TARGET_TYPE.LETTER]: '이 편지로 ',
  [REPORT_TARGET_TYPE.USER]: '',
};

// 위반 확인: 설명에 들어가는 신고 대상 종류별 조치 문구
const VIOLATION_ACTION_TEXT = {
  [REPORT_TARGET_TYPE.COMMENT]: '댓글을 삭제했어요.',
  [REPORT_TARGET_TYPE.FEED]: '피드를 가렸어요.',
  [REPORT_TARGET_TYPE.LETTER]: '편지를 삭제했어요.',
  [REPORT_TARGET_TYPE.USER]: '회원을 제한했어요.',
};

const getTitleArea = (resultType, targetType) => {
  switch (resultType) {
    case REPORT_RESULT_TYPE.VIOLATION:
      return {
        title: '신고하신 내용이 조치됐어요',
        description: `운영정책 위반이 확인되어 해당 ${VIOLATION_ACTION_TEXT[targetType] ?? ''}\n몽글을 함께 지켜 주셔서 고마워요.`,
      };

    case REPORT_RESULT_TYPE.NO_VIOLATION:
      return {
        title: '운영정책 위반이 확인되지 않았어요',
        description:
          '신고하신 내용을 검토했지만\n운영정책 위반에 해당하지 않아 조치하지 않았어요.',
      };

    case REPORT_RESULT_TYPE.WARNING:
      return {
        title: WARNING_TITLE[targetType],
        description:
          '운영정책 위반이 확인되어 경고 1회를 받았어요.\n한 번 더 경고를 받으면 7일 동안 이용이 정지돼요.',
      };

    case REPORT_RESULT_TYPE.SUSPENDED:
      return {
        title: '서비스 이용이 정지됐어요',
        description: `${SUSPENDED_TARGET_PREFIX[targetType] ?? ''}경고가 2회 쌓여\n7일 동안 서비스 이용이 정지됐어요.`,
      };

    case REPORT_RESULT_TYPE.SUSPENSION_LIFTED:
      return {
        title: '서비스 이용 정지가 풀렸어요',
        description:
          '지금부터 다시 몽글을 이용할 수 있어요.\n우리 함께 깨끗한 커뮤니티를 만들어 가요.',
      };

    default:
      return { title: null, description: null };
  }
};

// 경고 2회 · 이용 정지 해제 안내에서만 경고 내역을 보여준다
const SHOWS_HISTORY = [
  REPORT_RESULT_TYPE.SUSPENDED,
  REPORT_RESULT_TYPE.SUSPENSION_LIFTED,
];

// 신고당한 사람에게 보여주는 화면. 내용을 GET /sanction/:sanctionId 로 받는다
const SANCTION_RESULT_TYPES = [
  REPORT_RESULT_TYPE.WARNING,
  REPORT_RESULT_TYPE.SUSPENDED,
  REPORT_RESULT_TYPE.SUSPENSION_LIFTED,
];

// label · value 한 줄씩 쌓는 회색 박스 (요약 · 경고 내역)
// labelStyle: 경고 내역은 'n회차' 숫자 폭이 달라 value 가 밀리지 않게 너비를 고정한다
const InfoBox = ({ rows, labelStyle }) => (
  <View style={styles.infoBox}>
    {rows.map(({ label, value }, index) => (
      <View key={`${label}-${index}`} style={styles.infoRow}>
        <Text style={[styles.infoLabel, labelStyle]}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    ))}
  </View>
);

// 신고 결과 · 운영정책 · 이용 정지 해제 안내 화면. 알림 목록에서 알림을 눌러 들어온다 (getNotificationRoute)
// params: {
//   resultType: REPORT_RESULT_TYPE,
//   신고 검토 결과(VIOLATION · NO_VIOLATION): 알림에 복사해 둔 값을 그대로 넘긴다
//     targetType: REPORT_TARGET_TYPE, userCode, profileImageUrl, preview,  → TargetCard
//     reportReason, reportedAt, handledAt,  → 요약 박스
//   운영정책 안내(WARNING · SUSPENDED) · 이용 정지 해제 안내(SUSPENSION_LIFTED):
//     sanctionId  → GET /sanction/:sanctionId 로 TargetCard(해제 안내는 없음) · 요약 박스 · 경고 내역을 채운다
// }
const ReportResultScreen = () => {
  const navigation = useNavigation();
  const { params } = useRoute();
  const {
    resultType = REPORT_RESULT_TYPE.NO_VIOLATION,
    sanctionId,
    ...reportReview
  } = params ?? {};

  const isSanctionResult = SANCTION_RESULT_TYPES.includes(resultType);
  const { data: sanction, error: sanctionError } = useSanctionDetail(
    isSanctionResult ? sanctionId : null,
  );

  useEffect(() => {
    if (sanctionError) {
      console.warn('제재 내역을 불러오지 못했습니다.', getApiErrorDetail(sanctionError));
    }
  }, [sanctionError]);

  // 제재 내역을 받기 전에는 제목(대상 종류별) · 요약이 비어 깜빡이지 않게 내용을 그리지 않는다
  const isReady = !isSanctionResult || !!sanction;

  const target = isSanctionResult
    ? {
        type: toReportTargetType(sanction?.targetType),
        userCode: sanction?.userCode,
        profileImageUrl: sanction?.profileImageUrl,
        preview: sanction?.preview,
      }
    : {
        type: reportReview.targetType,
        userCode: reportReview.userCode,
        profileImageUrl: reportReview.profileImageUrl,
        preview: reportReview.preview,
      };

  const { summaryRows, historyRows } = isSanctionResult
    ? buildSanctionRows(resultType, sanction)
    : {
        summaryRows: buildReportReviewRows({ resultType, ...reportReview }),
        historyRows: [],
      };

  // 신고당한 사람은 '내가 올린 피드' 처럼 내 기준 문구, 신고한 사람은 '@id님의 피드를 신고했어요'
  const targetCardVariant = isSanctionResult
    ? TARGET_CARD_VARIANT.REPORTED
    : TARGET_CARD_VARIANT.REPORTER;
  // 이용 정지 해제 안내는 대상 카드가 없다.
  // 아이디를 쓰는 카드인데 상대가 탈퇴해 아이디가 없으면 카드를 그리지 않는다.
  // 신고당한 사람의 피드 · 계정 카드는 아이디를 쓰지 않아 그대로 그린다
  const showTargetCard =
    resultType !== REPORT_RESULT_TYPE.SUSPENSION_LIFTED &&
    (!!target.userCode ||
      (isSanctionResult && OWN_TARGET_TYPES.includes(target.type)));

  const { title, description } = getTitleArea(resultType, target.type);
  const showHistory =
    SHOWS_HISTORY.includes(resultType) && historyRows.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <TopSubNavigation
        type="text"
        leftIcon={IcArrowLeft}
        leftAccessibilityLabel="뒤로가기"
        headerText={HEADER_TEXT[resultType]}
        onPressClose={navigation.goBack}
        showNext={false}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isReady ? (
          <View style={styles.body}>
            <View style={styles.titleArea}>
              {title ? <Text style={styles.title}>{title}</Text> : null}
              {description ? (
                <Text style={styles.description}>{description}</Text>
              ) : null}
            </View>

            {showTargetCard ? (
              <View style={styles.targetContainer}>
                <TargetCard
                  variant={targetCardVariant}
                  type={target.type}
                  userCode={target.userCode}
                  profileImageUrl={target.profileImageUrl}
                  preview={target.preview}
                />
              </View>
            ) : null}

            {summaryRows.length > 0 ? (
              <View style={styles.summaryContainer}>
                <InfoBox rows={summaryRows} />
              </View>
            ) : null}

            {showHistory ? (
              <View style={styles.historyContainer}>
                <Text style={styles.sectionTitle}>경고 내역</Text>
                <InfoBox rows={historyRows} labelStyle={styles.historyLabel} />
              </View>
            ) : null}

            <PolicyLinks style={styles.linkContainer} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSurface,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  body: {
    flexGrow: 1,
    paddingBottom: padding.M,
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },

  titleArea: {
    paddingVertical: padding.XL,
    paddingHorizontal: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.M,
    alignSelf: 'stretch',
  },

  title: {
    ...typo.suitTitleSmall,
    color: colors.fgNeutralPrimary,
  },

  description: {
    ...typo.suitBodySmall400,
    color: colors.fgNeutralPrimary,
  },

  targetContainer: {
    paddingHorizontal: padding.L,
    paddingBottom: padding.XL,
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },

  summaryContainer: {
    paddingHorizontal: padding.L,
    paddingBottom: padding.XL,
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },

  historyContainer: {
    paddingHorizontal: padding.L,
    paddingBottom: padding.XL,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    alignSelf: 'stretch',
  },

  sectionTitle: {
    ...typo.suitLabelLargeStrong,
    color: colors.fgNeutralPrimary,
  },

  // summary · history 박스
  infoBox: {
    padding: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.M,
    alignSelf: 'stretch',
    borderRadius: radius.S,
    backgroundColor: colors.fillNeutralWeak,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.L,
    alignSelf: 'stretch',
  },

  infoLabel: {
    ...typo.suitBodySmall400,
    color: colors.fgNeutralSecondary,
  },

  historyLabel: {
    width: 33,
  },

  infoValue: {
    ...typo.suitLabelLargeStrong,
    color: colors.fgNeutralPrimary,
  },

  linkContainer: {
    paddingHorizontal: 12,
    alignSelf: 'stretch',
  },
});

export default ReportResultScreen;
