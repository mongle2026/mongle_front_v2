import { useCallback, useRef } from 'react';
import { Keyboard, Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

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
import useScrollFocusedFieldToCenter from '../../shared/hooks/useScrollFocusedFieldToCenter';
import { useGlobalOverlay } from '../../shared/providers/GlobalOverlayProvider';
import { getApiErrorMessage } from '../../shared/api/client';
import BottomBar from '../write/components/bottombar/BottomBar';

import ProfileImgEditBottomSheet from './components/ProfileImgEditBottomSheet';
import useProfileImgPicker from './hooks/useProfileImgPicker';
import useSignup from './hooks/useSignup';
import { ProfileImgUploadError } from './utils/uploadProfileImg';
import useSignupForm, {
  ID_MAX_LENGTH,
  NICKNAME_MAX_LENGTH,
} from './hooks/useSignupForm';

import { colors } from '../../shared/styles/color';
import { FONT } from '../../shared/styles/fontType';
import { gap, padding, radius } from '../../shared/styles/token';

const PROFILE_IMG_SIZE = 104;
const PROFILE_IMG_EDIT_OVERLAY_ID = 'signup-profile-img-edit';

const getIdDescription = ({ isIdTaken, isIdAvailable }) => {
  if (isIdTaken) return '이미 사용 중인 아이디예요.';
  if (isIdAvailable) return '사용할 수 있는 아이디예요.';
  return '영어, 숫자, _를 5~12자로 입력할 수 있어요.';
};

const SignupScreen = () => {
  const {
    id,
    changeId,
    idStatus,
    isIdTaken,
    isIdAvailable,
    nickname,
    setNickname,
    nicknameStatus,
    canSubmit,
  } = useSignupForm();

  const {
    profileImg,
    pickProfileImgFromLibrary,
    pickProfileImgFromFile,
    deleteProfileImg,
    getProfileImgKey,
  } = useProfileImgPicker();

  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  const isKeyboardVisible = keyboardHeight > 0;

  // BottomBar를 키보드 바로 위에 붙인다. 그 위의 ScrollView가 남은 높이만큼 줄어서
  // 가입하기 버튼까지 스크롤로 올릴 수 있다.
  // SafeAreaView가 이미 아래 안전영역만큼 띄워 두었으니 그만큼은 뺀다
  const keyboardInset = Math.max(0, keyboardHeight - insets.bottom);

  // 입력창에 포커스하면 키보드 위로 보이는 영역의 가운데로 스크롤한다
  const idFieldRef = useRef(null);
  const nicknameFieldRef = useRef(null);
  const {
    scrollViewRef,
    handleScrollViewLayout,
    focusField,
    blurField,
  } = useScrollFocusedFieldToCenter({ isKeyboardVisible });

  const handlePressHideKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const { openOverlay, showToast } = useGlobalOverlay();
  const navigation = useNavigation();

  // TODO: 받은 accessToken / refreshToken 저장은 로그인 붙일 때 함께 한다
  const { signup, isSigningUp } = useSignup({
    onSuccess: () => {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    },

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

  const handlePressSubmit = useCallback(() => {
    Keyboard.dismiss();
    signup({ userCode: id, nickname, getProfileImgKey });
  }, [signup, id, nickname, getProfileImgKey]);

  const handlePressProfileImgEdit = useCallback(() => {
    Keyboard.dismiss();

    openOverlay({
      id: PROFILE_IMG_EDIT_OVERLAY_ID,
      accessibilityLabel: '프로필 사진 편집 닫기',
      contentContainerStyle: styles.profileImgEditOverlay,
      renderContent: ({ close }) => (
        <ProfileImgEditBottomSheet
          onPressAlbum={() => {
            close();
            pickProfileImgFromLibrary();
          }}
          onPressFile={() => {
            close();
            pickProfileImgFromFile();
          }}
          onPressDelete={() => {
            close();
            deleteProfileImg();
          }}
          onClose={close}
        />
      ),
    });
  }, [openOverlay, pickProfileImgFromLibrary, pickProfileImgFromFile, deleteProfileImg]);

  return (
    <SafeAreaView style={styles.container}>
      <TopSubNavigation
        leftIcon={IcArrowLeft}
        leftAccessibilityLabel="뒤로가기"
        showShare={false}
        showMore={false}
      />

      <ScrollView
        ref={scrollViewRef}
        onLayout={handleScrollViewLayout}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.profile}>
            <ProfileImg imageUri={profileImg?.uri} style={styles.profileImg} />

            <Button
              variant={BUTTON_VARIANT.WEAK}
              size={BUTTON_SIZE.M}
              font={FONT.SUIT}
              style={styles.profileEditButton}
              onPress={handlePressProfileImgEdit}
            >
              프로필 사진 편집
            </Button>
          </View>

          <TextField
            containerRef={idFieldRef}
            onFocus={() => focusField(idFieldRef)}
            onBlur={() => blurField(idFieldRef)}
            label="아이디"
            value={id}
            onChangeText={changeId}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={Platform.OS === 'android' ? 'visible-password' : 'default'}
            placeholder="아이디를 입력하세요."
            description={getIdDescription({ isIdTaken, isIdAvailable })}
            maxLength={ID_MAX_LENGTH}
            status={idStatus}
          />

          {/* 닉네임은 @ 없이 입력한다 */}
          <TextField
            containerRef={nicknameFieldRef}
            onFocus={() => focusField(nicknameFieldRef)}
            onBlur={() => blurField(nicknameFieldRef)}
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
            disabled={isSigningUp}
            onPress={handlePressSubmit}
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

  // BottomSheet를 화면 전체 위에 띄운다
  profileImgEditOverlay: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
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
