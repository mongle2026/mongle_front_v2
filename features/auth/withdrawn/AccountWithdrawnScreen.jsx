import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Empty from '../../../shared/components/content/Empty';
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from '../../../shared/components/action/Button';

import { colors } from '../../../shared/styles/color';
import { FONT } from '../../../shared/styles/fontType';
import { padding } from '../../../shared/styles/token';

/**
 * 영구 정지 후 7일이 지나 자동으로 탈퇴 처리된 계정
 *
 * TODO: 확인 버튼 동작 연결
 */
const AccountWithdrawnScreen = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Empty
        type="alert"
        title="계정이 탈퇴 처리됐어요"
        body={`영구 정지 후 7일이 지나\n운영정책에 따라 탈퇴 처리됐어요.\n일정 기간 동안 다시 가입할 수 없어요.`}
      />
    </View>

    <View style={styles.footer}>
      <Button
        variant={BUTTON_VARIANT.WEAK}
        size={BUTTON_SIZE.XL}
        font={FONT.SUIT}
        style={styles.confirmButton}
      >
        확인
      </Button>
    </View>
  </SafeAreaView>
);

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

export default AccountWithdrawnScreen;
