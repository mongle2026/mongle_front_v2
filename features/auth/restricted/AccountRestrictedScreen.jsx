import { StyleSheet, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import Empty from '../../../shared/components/content/Empty';
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from '../../../shared/components/action/Button';
import { useAuthStore } from '../../../shared/auth/useAuthStore';

import { getReportReasonLabel } from '../../report/constants';
import { APPEAL_STATUS } from './constants';
import useRestrictionRecheck from './hooks/useRestrictionRecheck';
import { formatDate } from '../../../shared/utils/dateUtils';
import { colors } from '../../../shared/styles/color';
import { FONT } from '../../../shared/styles/fontType';
import { gap, padding } from '../../../shared/styles/token';

// 기간 정지 문구
const getTemporaryContent = ({ reasonLabel, until, isAppealRejected }) =>
  isAppealRejected
    ? {
        title: '서비스 이용 정지가 유지돼요',
        body: `이의 신청을 검토했으나 운영정책 위반\n(${reasonLabel})이 확인됐어요.\n${until}이용 정지가 유지돼요.`,
      }
    : {
        title: '서비스 이용이 정지됐어요',
        body: `운영정책 위반(${reasonLabel})으로\n${until}서비스를 이용할 수 없어요.`,
      };

// 영구 정지 문구. 7일 뒤 자동으로 탈퇴되고, 그 전까지 이의 신청을 1회 할 수 있다
const getPermanentContent = ({
  reasonLabel,
  withdrawDate,
  isAppealPending,
  isAppealRejected,
}) => {
  if (isAppealRejected) {
    return {
      title: '이의 신청이 기각됐어요',
      body: `검토 결과 운영정책 위반이 확인되어\n계정 영구 정지가 유지돼요.\n${withdrawDate} 이후 자동으로 탈퇴 처리돼요.`,
    };
  }

  if (isAppealPending) {
    return {
      title: '계정이 영구 정지됐어요',
      body: `운영정책 위반(${reasonLabel})으로\n계정을 더 이상 이용할 수 없어요.\n이의 신청을 검토하고 있어요.\n결과는 알림으로 알려 드릴게요.`,
    };
  }

  return {
    title: '계정이 영구 정지됐어요',
    body: `운영정책 위반(${reasonLabel})으로\n계정을 더 이상 이용할 수 없어요.\n7일 뒤(${withdrawDate}) 자동으로 탈퇴 처리되며,\n그 전까지 이의 신청을 1회 할 수 있어요.`,
  };
};

/**
 * 신고로 이용 제한된 계정. 이 화면만 띄워서 앱에 들어가지 못하게 막는다
 *
 * 제한 내용은 useAuthStore.restriction 에서 읽는다 (API 403 ACCOUNT_RESTRICTED 응답으로 채워진다)
 * - reason: 백엔드 ReportReason('SPAM' 등). 신고하기 화면과 같은 문구('스팸 · 광고')로 보여준다
 * - restrictedAt: 제한이 시작된 시각(ISO 문자열). 이의 신청 화면의 제한 기간에 쓴다
 * - restrictedUntil: 제한이 끝나는 시각(ISO 문자열). 영구 정지면 null 이라 영구 정지 문구를 쓴다
 * - appealDeadline: 이의 신청할 수 있는 마지막 시각(ISO 문자열). 영구 정지면 제한 시작 + 7일이라 탈퇴 예정일로 쓴다.
 *   403 응답에는 없어서 화면에 들어올 때 GET /sanction/restriction 으로 받는다 (useRestrictionRecheck)
 * - rejoinAvailableAt: 영구 정지일 때 재가입이 풀리는 시각(ISO 문자열). 이의 신청 화면의 제한 기간에 쓴다.
 *   appealDeadline 처럼 GET /sanction/restriction 으로 받는다
 * - appealStatus: 이의 신청 상태. 검토 중이거나 기각되면 이의 신청하기 버튼을 막는다.
 *   검토 중 · 기각이면 그에 맞는 문구로 안내한다
 *
 * 앱으로 돌아오거나 푸시를 받으면 제한 상태를 다시 확인한다 (useRestrictionRecheck)
 */
const AccountRestrictedScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    reason,
    restrictedAt,
    restrictedUntil,
    appealDeadline,
    appealStatus,
    rejoinAvailableAt,
  } = useAuthStore(state => state.restriction) ?? {};

  const isPermanent = restrictedUntil == null;

  const reasonLabel = getReportReasonLabel(reason);
  const until = restrictedUntil ? `${formatDate(restrictedUntil)} 까지 ` : '';

  useRestrictionRecheck();

  const isAppealPending = appealStatus === APPEAL_STATUS.PENDING;
  const isAppealRejected = appealStatus === APPEAL_STATUS.REJECTED;
  const isAppealDisabled = isAppealPending || isAppealRejected;

  const { title, body } = isPermanent
    ? getPermanentContent({
        reasonLabel,
        withdrawDate: formatDate(appealDeadline),
        isAppealPending,
        isAppealRejected,
      })
    : getTemporaryContent({ reasonLabel, until, isAppealRejected });

  const appealButtonLabel = isAppealRejected
    ? '이의 신청 완료'
    : isAppealPending
      ? '이의 신청 검토 중'
      : '이의 신청하기';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Empty
          type="alert"
          title={title}
          body={body}
          showPolicyLinks
        />
      </View>

      <View style={styles.footer}>
        <Button
          variant={
            isAppealDisabled ? BUTTON_VARIANT.DISABLED : BUTTON_VARIANT.WEAK
          }
          size={BUTTON_SIZE.XL}
          font={FONT.SUIT}
          style={styles.appealButton}
          onPress={() =>
            navigation.navigate('Appeal', {
              reason,
              restrictedAt,
              restrictedUntil,
              rejoinAvailableAt,
              // 버튼과 겹쳐도 되고, 안드로이드 하단 네비게이션 바 위에만 뜨면 된다
              toastBottomOffset: insets.bottom,
            })
          }
        >
          {appealButtonLabel}
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSurface,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
  },

  // 화면 맨 아래에 붙인다
  footer: {
    paddingHorizontal: padding.L,
    paddingBottom: padding.L,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: gap.M,
  },

  // Button은 기본이 alignSelf: 'flex-start'라서 가로로 꽉 채운다
  appealButton: {
    flex: 1,
  },
});

export default AccountRestrictedScreen;
