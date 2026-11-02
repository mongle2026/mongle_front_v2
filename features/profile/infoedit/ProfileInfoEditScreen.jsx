import { useCallback } from 'react';
import { Keyboard, StyleSheet } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import IcArrowLeft from '../../../assets/icons/ic_arrow_left.svg';

import TopSubNavigation from '../../../shared/components/navigation/topnavigation/TopSubNavigation';
import LoadStateView from '../../../shared/components/feedback/LoadStateView';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import { useGlobalOverlay } from '../../../shared/providers/GlobalOverlayProvider';
import { getApiErrorMessage } from '../../../shared/api/client';

import ProfileForm from '../components/ProfileForm';
import useProfileForm from '../hooks/useProfileForm';
import useProfileImgPicker from '../hooks/useProfileImgPicker';
import { ProfileImgUploadError } from '../utils/uploadProfileImg';
import useUpdateProfile from './hooks/useUpdateProfile';

import { colors } from '../../../shared/styles/color';

const HEADER_TEXT = '프로필 정보 편집';
const NEXT_TEXT = '확인';

// 지금 내 사진 · 아이디 · 닉네임을 처음 값으로 채운 편집 화면
const ProfileInfoEditForm = ({ currentUser }) => {
  const navigation = useNavigation();

  const form = useProfileForm({
    initialId: currentUser.userCode,
    initialNickname: currentUser.nickname,
  });

  const profileImgPicker = useProfileImgPicker({
    initialProfileImgUri: currentUser.profileImageUri,
  });

  const insets = useSafeAreaInsets();
  const { showToast } = useGlobalOverlay();

  const { updateProfile, isUpdatingProfile } = useUpdateProfile({
    onSuccess: navigation.goBack,

    onError: error => {
      showToast({
        message: error instanceof ProfileImgUploadError
          ? error.message
          : getApiErrorMessage(error, '프로필을 수정하지 못했습니다.'),
        icon: 'alert',
        iconColor: colors.fgCriticalInverted,
        bottomOffset: insets.bottom,
      });
    },
  });

  const { id, nickname, isIdChanged, isNicknameChanged, isValid } = form;
  const { isProfileImgChanged, getProfileImgKey } = profileImgPicker;

  // 하나라도 바꿨고, 바꾼 값이 규칙을 만족할 때만 확인을 누를 수 있다
  const canSubmit = isValid && (isIdChanged || isNicknameChanged || isProfileImgChanged);

  const handlePressNext = useCallback(() => {
    if (!canSubmit || isUpdatingProfile) return;

    Keyboard.dismiss();

    updateProfile({
      userCode: isIdChanged ? id : undefined,
      nickname: isNicknameChanged ? nickname : undefined,
      getProfileImgKey: isProfileImgChanged ? getProfileImgKey : undefined,
    });
  }, [
    canSubmit,
    isUpdatingProfile,
    updateProfile,
    isIdChanged,
    id,
    isNicknameChanged,
    nickname,
    isProfileImgChanged,
    getProfileImgKey,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <TopSubNavigation
        type="text"
        leftIcon={IcArrowLeft}
        leftAccessibilityLabel="뒤로가기"
        headerText={HEADER_TEXT}
        nextText={NEXT_TEXT}
        onPressClose={navigation.goBack}
        onPressNext={handlePressNext}
        isNextLoading={isUpdatingProfile}
        nextTextStyle={{
          color: canSubmit ? colors.fgNeutralSecondary : colors.fgDisabled,
        }}
      />

      <ProfileForm form={form} profileImgPicker={profileImgPicker} />
    </SafeAreaView>
  );
};

const ProfileInfoEditScreen = () => {
  const navigation = useNavigation();
  const { currentUser } = useCurrentUser();

  // 프로필 탭에서 들어오므로 보통은 이미 불러와 있다. 처음 값을 채울 수 있을 때까지 기다린다
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <TopSubNavigation
          type="text"
          leftIcon={IcArrowLeft}
          leftAccessibilityLabel="뒤로가기"
          headerText={HEADER_TEXT}
          nextText={NEXT_TEXT}
          onPressClose={navigation.goBack}
          nextTextStyle={{ color: colors.fgDisabled }}
        />

        <LoadStateView isLoading />
      </SafeAreaView>
    );
  }

  return <ProfileInfoEditForm currentUser={currentUser} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSurface,
  },
});

export default ProfileInfoEditScreen;
