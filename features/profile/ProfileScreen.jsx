import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import IcSettingStroke from '../../assets/icons/ic_setting_stroke.svg';
import IcPersonList from '../../assets/icons/ic_personlist.svg';

import TopNavigation from '../../shared/components/navigation/topnavigation/TopNavigation';
import IconButton from '../../shared/components/action/IconButton';
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from '../../shared/components/action/Button';
import useCurrentUser from '../../shared/hooks/useCurrentUser';
import { useGlobalOverlay } from '../../shared/providers/GlobalOverlayProvider';
import { colors } from '../../shared/styles/color';
import { FONT } from '../../shared/styles/fontType';
import { padding } from '../../shared/styles/token';

import { profileKeys } from './api/profileKeys';
import ProfileEditBottomSheet from './components/ProfileEditBottomSheet';
import ProfileCoverList from './components/ProfileCoverList';
import ProfileUserRow from './components/ProfileUserRow';
import useProfileFeedCovers from './hooks/useProfileFeedCovers';

const PROFILE_EDIT_OVERLAY_ID = 'profile-edit';

// 프로필 탭. 내 정보 + 내가 쓴 피드의 노래 커버를 한 줄에 두 개씩 보여준다
const ProfileScreen = () => {
  const { currentUser, userId } = useCurrentUser();
  const coverQuery = useProfileFeedCovers({
    ownerId: userId,
    queryKey: profileKeys.covers(userId),
  });

  const navigation = useNavigation();
  const { openOverlay } = useGlobalOverlay();

  const handlePressEdit = useCallback(() => {
    openOverlay({
      id: PROFILE_EDIT_OVERLAY_ID,
      accessibilityLabel: '프로필 편집 닫기',
      contentContainerStyle: styles.profileEditOverlay,
      renderContent: ({ close }) => (
        <ProfileEditBottomSheet
          onPressProfileInfoEdit={() => {
            close();
            navigation.navigate('ProfileInfoEdit');
          }}
          onPressFeedEdit={() => {
            close();
            navigation.navigate('ProfileFeedEdit');
          }}
          onClose={close}
        />
      ),
    });
  }, [openOverlay, navigation]);

  const handlePressFollow = useCallback(() => {
    navigation.navigate('ProfileFollow');
  }, [navigation]);

  const header = (
    <>
      <ProfileUserRow
        imageUri={currentUser?.profileImageUri}
        userCode={currentUser?.userCode}
      />

      <View style={styles.actionRow}>
        <Button
          variant={BUTTON_VARIANT.WEAK}
          size={BUTTON_SIZE.L}
          font={FONT.SUIT}
          style={styles.editButton}
          onPress={handlePressEdit}
        >
          프로필 편집
        </Button>

        <IconButton
          size="XXL"
          icon={IcPersonList}
          color={colors.fgNeutralSecondary}
          accessibilityLabel="팔로우/팔로잉 목록"
          style={styles.personListButton}
          onPress={handlePressFollow}
        />
      </View>
    </>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <TopNavigation
        title={currentUser?.nickname ?? ''}
        icon={IcSettingStroke}
        buttonAccessibilityLabel="설정"
      />

      {/* TopNavigation 아래 전체(프로필 정보 + 커버 그리드)가 함께 스크롤된다 */}
      <ProfileCoverList header={header} {...coverQuery} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },

  actionRow: {
    paddingBottom: padding.M,
    flexDirection: 'row',
    alignItems: 'center',
    gap: padding.XS,
    alignSelf: 'stretch',
  },

  // IconButton 을 뺀 나머지 폭을 채운다
  editButton: {
    flex: 1,
  },

  personListButton: {
    backgroundColor: colors.fillNeutralWeak,
  },

  // BottomSheet를 화면 전체 위에 띄운다
  profileEditOverlay: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
  },
});

export default ProfileScreen;
