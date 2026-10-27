import { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import IcArrowLeft from '../../../assets/icons/ic_arrow_left.svg';
import IlDialogLogout from '../../../assets/illustrations/il_dialog_logout.svg';

import TopSubNavigation from '../../../shared/components/navigation/topnavigation/TopSubNavigation';
import { Dialog } from '../../../shared/components/feedback/Dialog';
import { BUTTON_VARIANT } from '../../../shared/components/action/Button';
import { useDialog } from '../../../shared/providers/DialogProvider';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';

import { colors } from '../../../shared/styles/color';

import ListRow from '../components/ListRow';
import useLogout from '../hooks/useLogout';

const HEADER_TEXT = '계정 정보';

// useCurrentUser 의 provider 값별로 연동된 계정 캡션
const PROVIDER_CAPTION = {
  KAKAO: '카카오 로그인',
  APPLE: '애플 로그인',
};

// '카카오 로그인 / 이메일'. 이메일이 없으면 로그인 종류만, 둘 다 없으면 캡션 없음
const getAccountCaption = user =>
  [PROVIDER_CAPTION[user?.provider], user?.email].filter(Boolean).join(' / ') ||
  undefined;

// 설정 화면의 계정 정보 행으로 들어오는 계정 정보 화면
const SettingAccountScreen = () => {
  const navigation = useNavigation();
  const { openDialog } = useDialog();
  const { currentUser } = useCurrentUser();
  const logout = useLogout();

  const handlePressLogout = useCallback(() => {
    openDialog({
      id: 'logout-dialog',
      closeOnDimPress: true,
      closeOnBackPress: true,
      accessibilityLabel: '로그아웃 확인 창 닫기',
      renderContent: ({ close }) => (
        <Dialog
          illustration={IlDialogLogout}
          title="로그아웃하시겠어요?"
          description="다시 이용하려면 로그인이 필요해요."
          cancelText="닫기"
          confirmText="로그아웃"
          confirmVariant={BUTTON_VARIANT.SOLID}
          onCancel={close}
          onConfirm={() => {
            close();
            void logout();
          }}
        />
      ),
    });
  }, [logout, openDialog]);

  return (
    <SafeAreaView style={styles.container}>
      <TopSubNavigation
        type="text"
        leftIcon={IcArrowLeft}
        leftAccessibilityLabel="뒤로가기"
        headerText={HEADER_TEXT}
        onPressClose={navigation.goBack}
        showNext={false}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <ListRow
          text="연동된 계정"
          caption={getAccountCaption(currentUser)}
        />

        {/* 로그아웃하면 RootNavigator 가 로그인 전용 화면을 빼서 설정 화면으로 돌아간다 */}
        <ListRow text="로그아웃" onPress={handlePressLogout} />

        <ListRow text="계정 탈퇴" textStyle={styles.criticalText} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSurface,
  },

  criticalText: {
    color: colors.fgCritical,
  },
});

export default SettingAccountScreen;
