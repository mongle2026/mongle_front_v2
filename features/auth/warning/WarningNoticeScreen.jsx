import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Empty from '../../../shared/components/content/Empty';
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from '../../../shared/components/action/Button';
import apiClient, { getApiErrorDetail } from '../../../shared/api/client';
import { useAuthStore } from '../../../shared/auth/useAuthStore';

import { REPORT_REASONS } from '../../report/constants';
import { getRoSuffix } from '../../../shared/utils/koreanUtils';
import { colors } from '../../../shared/styles/color';
import { FONT } from '../../../shared/styles/fontType';
import { padding } from '../../../shared/styles/token';

/**
 * 신고로 경고 1회를 받은 계정. 앱에 들어가기 전에 한 번 보여준다
 *
 * 경고 내용은 useAuthStore.warning 에서 읽는다 (useWarningCheck 가 GET /sanction/warning 으로 채운다)
 * - reason: 백엔드 ReportReason('SPAM' 등). 신고하기 화면과 같은 문구('스팸 · 광고')로 보여준다
 *
 * 확인을 누르면 warning 을 지워서 원래 앱(홈)으로 들여보내고, 서버에 확인했다고 남긴다.
 * 남기지 못하면 다음에 앱으로 돌아올 때 다시 보인다
 */
const WarningNoticeScreen = () => {
  const reason = useAuthStore(state => state.warning?.reason);
  const setWarning = useAuthStore(state => state.setWarning);

  const reasonLabel =
    REPORT_REASONS.find(item => item.key === reason)?.label ?? reason;

  const handleConfirm = () => {
    setWarning(null);

    apiClient.post('/sanction/warning/acknowledge').catch(error => {
      console.warn('경고 확인을 저장하지 못했습니다.', getApiErrorDetail(error));
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Empty
          type="warning"
          title="운영정책 위반으로 경고를 받았어요"
          body={`${reasonLabel}${getRoSuffix(reasonLabel)} 경고 1회를 받았어요.\n한 번 더 경고를 받으면 7일 동안 이용이 정지돼요.`}
        />
      </View>

      <View style={styles.footer}>
        <Button
          variant={BUTTON_VARIANT.SOLID}
          size={BUTTON_SIZE.XL}
          font={FONT.SUIT}
          style={styles.confirmButton}
          onPress={handleConfirm}
        >
          확인
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
  },

  // Button은 기본이 alignSelf: 'flex-start'라서 가로로 꽉 채운다
  confirmButton: {
    flex: 1,
  },
});

export default WarningNoticeScreen;
