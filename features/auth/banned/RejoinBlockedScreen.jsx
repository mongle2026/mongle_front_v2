import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import Empty from '../../../shared/components/content/Empty';
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from '../../../shared/components/action/Button';

import { formatDate } from '../../../shared/utils/dateUtils';
import { colors } from '../../../shared/styles/color';
import { FONT } from '../../../shared/styles/fontType';
import { padding } from '../../../shared/styles/token';

/**
 * 영구 정지로 탈퇴된 계정이 다시 가입하려고 할 때
 * 로그인 응답이 403 ACCOUNT_BANNED 면 로그인 화면(WelcomeScreen)이 띄운다. 확인을 누르면 로그인 화면으로 돌아간다
 *
 * route.params
 * - rejoinAvailableAt: 다시 가입할 수 있는 시각(ISO 문자열). ACCOUNT_BANNED 응답의 rejoinAvailableAt (banned_account.expires_at)
 */
const RejoinBlockedScreen = () => {
  const navigation = useNavigation();
  const { rejoinAvailableAt } = useRoute().params ?? {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Empty
          type="alert"
          title="지금은 가입할 수 없어요"
          body={`운영정책 위반으로 탈퇴 처리된 계정이에요.\n${formatDate(rejoinAvailableAt)} 이후에 다시 가입할 수 있어요.`}
          showPolicyLinks
        />
      </View>

      <View style={styles.footer}>
        <Button
          variant={BUTTON_VARIANT.WEAK}
          size={BUTTON_SIZE.XL}
          font={FONT.SUIT}
          style={styles.confirmButton}
          onPress={() => navigation.goBack()}
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

export default RejoinBlockedScreen;
