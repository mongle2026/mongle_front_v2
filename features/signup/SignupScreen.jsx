import { useCallback } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import IcArrowLeft from '../../assets/icons/ic_arrow_left.svg';

import TopSubNavigation from '../../shared/components/navigation/topnavigation/TopSubNavigation';
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from '../../shared/components/action/Button';
import { useGlobalOverlay } from '../../shared/providers/GlobalOverlayProvider';
import { getApiErrorMessage } from '../../shared/api/client';

import ProfileForm from '../profile/components/ProfileForm';
import useProfileForm, { isValidNickname } from '../profile/hooks/useProfileForm';
import useProfileImgPicker from '../profile/hooks/useProfileImgPicker';
import { ProfileImgUploadError } from '../profile/utils/uploadProfileImg';
import useSignup from './hooks/useSignup';

import { colors } from '../../shared/styles/color';
import { FONT } from '../../shared/styles/fontType';
import { gap, padding } from '../../shared/styles/token';

const SignupScreen = () => {
  const navigation = useNavigation();

  // 카카오/애플 로그인에서 받아 약관 화면을 거쳐 넘어온 값
  const { signupToken, suggestedNickname } = useRoute().params ?? {};

  // 소셜 계정의 닉네임은 닉네임 규칙에 맞을 때만 처음 값으로 채운다
  const form = useProfileForm({
    initialNickname: isValidNickname(suggestedNickname) ? suggestedNickname : '',
  });

  const profileImgPicker = useProfileImgPicker({ signupToken });

  const insets = useSafeAreaInsets();
  const { showToast } = useGlobalOverlay();

  const { signup, isSigningUp } = useSignup({
    signupToken,

    onError: error => {
      showToast({
        message: error instanceof ProfileImgUploadError
          ? error.message
          : getApiErrorMessage(error, '가입하지 못했습니다.'),
        icon: 'alert',
        iconColor: colors.fgCriticalInverted,
        bottomOffset: insets.bottom,
      });
    },
  });

  const { id, nickname, isValid: canSubmit } = form;
  const { getProfileImgKey } = profileImgPicker;

  const handlePressSubmit = useCallback(() => {
    Keyboard.dismiss();
    signup({ userCode: id, nickname, getProfileImgKey });
  }, [signup, id, nickname, getProfileImgKey]);

  return (
    <SafeAreaView style={styles.container}>
      <TopSubNavigation
        leftIcon={IcArrowLeft}
        leftAccessibilityLabel="뒤로가기"
        onPressClose={navigation.goBack}
        showShare={false}
        showMore={false}
      />

      <ProfileForm
        form={form}
        profileImgPicker={profileImgPicker}
        footer={(
          <View style={styles.footer}>
            <Button
              variant={canSubmit ? BUTTON_VARIANT.SOLID : BUTTON_VARIANT.DISABLED}
              size={BUTTON_SIZE.XL}
              font={FONT.SUIT}
              style={styles.submitButton}
              disabled={isSigningUp}
              onPress={handlePressSubmit}
            >
              가입하기
            </Button>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSurface,
  },

  // 화면 맨 아래에 붙인다
  footer: {
    width: '100%',
    marginTop: 'auto',
    padding: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.M,
  },

  // Button은 기본이 alignSelf: 'flex-start'라서 가로로 꽉 채운다
  submitButton: {
    alignSelf: 'stretch',
  },
});

export default SignupScreen;
