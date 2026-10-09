import { useCallback } from 'react';
import { Keyboard, Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import IcArrowLeft from '../../assets/icons/ic_arrow_left.svg';

import TopSubNavigation from '../../shared/components/navigation/topnavigation/TopSubNavigation';
import ProfileImg from '../../shared/components/atomic/ProfileImg';
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from '../../shared/components/action/Button';
import TextField from '../../shared/components/input/TextField';
import { useKeyboardHeight } from '../../shared/hooks/useFloatingBottomOffset';
import BottomBar from '../write/components/bottombar/BottomBar';

import useSignupForm, {
  ID_MAX_LENGTH,
  NICKNAME_MAX_LENGTH,
} from './hooks/useSignupForm';

import { colors } from '../../shared/styles/color';
import { FONT } from '../../shared/styles/fontType';
import { gap, padding, radius } from '../../shared/styles/token';

const PROFILE_IMG_SIZE = 104;

const SignupScreen = () => {
  const {
    id,
    changeId,
    idStatus,
    nickname,
    setNickname,
    nicknameStatus,
    canSubmit,
  } = useSignupForm();

  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  const isKeyboardVisible = keyboardHeight > 0;

  // BottomBar를 키보드 바로 위에 붙인다. 그 위의 ScrollView가 남은 높이만큼 줄어서
  // 가입하기 버튼까지 스크롤로 올릴 수 있다.
  // SafeAreaView가 이미 아래 안전영역만큼 띄워 두었으니 그만큼은 뺀다
  const keyboardInset = Math.max(0, keyboardHeight - insets.bottom);

  const handlePressHideKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <TopSubNavigation
        leftIcon={IcArrowLeft}
        leftAccessibilityLabel="뒤로가기"
        showShare={false}
        showMore={false}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.profile}>
            <ProfileImg style={styles.profileImg} />

            <Button
              variant={BUTTON_VARIANT.WEAK}
              size={BUTTON_SIZE.M}
              font={FONT.SUIT}
              style={styles.profileEditButton}
            >
              프로필 사진 편집
            </Button>
          </View>

          <TextField
            label="아이디"
            value={id}
            onChangeText={changeId}
            // 키보드가 첫 글자를 대문자로 바꾸지 않게 한다
            autoCapitalize="none"
            autoCorrect={false}
            // Android 키보드는 입력 중인 글자를 묶어서(조합) 들고 있어서, 대문자를 소문자로 바꿔 넣으면
            // 앞 글자가 한 번 더 붙는다(qw + E → qwqwe). 조합을 쓰지 않는 키보드로 바꿔서 막는다
            keyboardType={Platform.OS === 'android' ? 'visible-password' : 'default'}
            placeholder="아이디를 입력하세요."
            description="영어, 숫자, _를 5~12자로 입력할 수 있어요."
            maxLength={ID_MAX_LENGTH}
            status={idStatus}
          />

          {/* 닉네임은 @ 없이 입력한다 */}
          <TextField
            label="닉네임"
            prefix={null}
            value={nickname}
            onChangeText={setNickname}
            placeholder="닉네임을 입력하세요"
            description="2~8자로 띄어쓰기 없이 입력해 주세요."
            maxLength={NICKNAME_MAX_LENGTH}
            status={nicknameStatus}
          />
        </View>

        <View style={styles.footer}>
          <Button
            variant={canSubmit ? BUTTON_VARIANT.SOLID : BUTTON_VARIANT.DISABLED}
            size={BUTTON_SIZE.XL}
            font={FONT.SUIT}
            style={styles.submitButton}
          >
            가입하기
          </Button>
        </View>
      </ScrollView>

      {isKeyboardVisible && (
        <BottomBar
          showLeftActions={false}
          keyboardVisible
          onPressHideKeyboard={handlePressHideKeyboard}
          style={{ marginBottom: keyboardInset }}
        />
      )}
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

  // 내용이 짧을 때도 화면을 채워서 가입하기 버튼이 맨 아래에 붙게 한다
  scrollContent: {
    flexGrow: 1,
  },

  content: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },

  profile: {
    paddingVertical: padding.XXL,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap.M,
    alignSelf: 'stretch',
  },

  profileImg: {
    width: PROFILE_IMG_SIZE,
    height: PROFILE_IMG_SIZE,
    borderRadius: radius.S,
  },

  // Button은 기본이 alignSelf: 'flex-start'라서 가운데 정렬을 다시 지정한다
  profileEditButton: {
    alignSelf: 'center',
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
