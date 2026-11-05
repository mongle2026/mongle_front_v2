import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';

import Empty from '../../../shared/components/content/Empty';
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from '../../../shared/components/action/Button';

import { REPORT_REASONS } from '../../report/constants';
import { formatDate } from '../../../shared/utils/dateUtils';
import { colors } from '../../../shared/styles/color';
import { FONT } from '../../../shared/styles/fontType';
import { gap, padding } from '../../../shared/styles/token';

/**
 * 신고로 이용 제한된 계정. 이 화면만 띄워서 앱에 들어가지 못하게 막는다
 *
 * params: { reason, restrictedUntil } (App.js 가 API 403 ACCOUNT_RESTRICTED 응답으로 넣는다)
 * - reason: 백엔드 ReportReason('SPAM' 등). 신고하기 화면과 같은 문구('스팸 · 광고')로 보여준다
 * - restrictedUntil: 제한이 끝나는 시각(ISO 문자열). 영구 제한이면 null 이라 날짜를 뺀다
 */
const AccountRestrictedScreen = () => {
  const { reason, restrictedUntil } = useRoute().params ?? {};

  const reasonLabel =
    REPORT_REASONS.find(item => item.key === reason)?.label ?? reason;
  const until = restrictedUntil ? `${formatDate(restrictedUntil)} 까지 ` : '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Empty
          type="alert"
          title="계정 이용이 제한됐어요"
          body={`운영정책 위반(${reasonLabel})으로\n${until}서비스를 이용할 수 없어요.`}
        />
      </View>

      <View style={styles.footer}>
        <Button
          variant={BUTTON_VARIANT.WEAK}
          size={BUTTON_SIZE.XL}
          font={FONT.SUIT}
          style={styles.appealButton}
        >
          이의 신청하기
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
