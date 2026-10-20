import { useCallback, useRef } from 'react';
import { Keyboard, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ProfileImg from '../../../shared/components/atomic/ProfileImg';
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from '../../../shared/components/action/Button';
import TextField from '../../../shared/components/input/TextField';
import { useKeyboardHeight } from '../../../shared/hooks/useFloatingBottomOffset';
import useScrollFocusedFieldToCenter from '../../../shared/hooks/useScrollFocusedFieldToCenter';
import { useGlobalOverlay } from '../../../shared/providers/GlobalOverlayProvider';

import ProfileImgEditBottomSheet from './ProfileImgEditBottomSheet';
import { ID_MAX_LENGTH, NICKNAME_MAX_LENGTH } from '../hooks/useProfileForm';

import { FONT } from '../../../shared/styles/fontType';
import { gap, padding, radius } from '../../../shared/styles/token';

const PROFILE_IMG_SIZE = 104;
const PROFILE_IMG_EDIT_OVERLAY_ID = 'profile-img-edit';

const getIdDescription = ({ isIdTaken, isIdAvailable }) => {
  if (isIdTaken) return '이미 사용 중인 아이디예요.';
  if (isIdAvailable) return '사용할 수 있는 아이디예요.';
  return '영어, 숫자, _를 5~12자로 입력할 수 있어요.';
};

/**
 * 프로필 사진 · 아이디 · 닉네임 입력 본문. SignupScreen(가입) / ProfileInfoEditScreen(편집) 공통.
 * 키보드가 올라오면 입력창이 보이는 영역의 가운데로 스크롤한다.
 *
 * form: useProfileForm 반환값
 * profileImgPicker: useProfileImgPicker 반환값
 * footer: 입력창 아래 화면 맨 아래에 붙일 내용 (가입하기 버튼 등). 없으면 비워 둔다
 */
const ProfileForm = ({ form, profileImgPicker, footer }) => {
  const {
    id,
    changeId,
    idStatus,
    isIdTaken,
    isIdAvailable,
    nickname,
    setNickname,
    nicknameStatus,
  } = form;

  const {
    profileImg,
    pickProfileImgFromLibrary,
    pickProfileImgFromFile,
    deleteProfileImg,
  } = profileImgPicker;

  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  const isKeyboardVisible = keyboardHeight > 0;

  // ScrollView를 키보드 높이만큼 줄여서 아래 내용까지 스크롤로 올릴 수 있게 한다.
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

  const { openOverlay } = useGlobalOverlay();

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
    <ScrollView
      ref={scrollViewRef}
      onLayout={handleScrollViewLayout}
      style={[styles.scrollView, { marginBottom: keyboardInset }]}
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

      {footer}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },

  // 내용이 짧을 때도 화면을 채워서 footer가 맨 아래에 붙게 한다
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
});

export default ProfileForm;
