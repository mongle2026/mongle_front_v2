import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import IcArrowLeft from '../../../assets/icons/ic_arrow_left.svg';

import TopSubNavigation from '../../../shared/components/navigation/topnavigation/TopSubNavigation';
import Empty from '../../../shared/components/content/Empty';
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from '../../../shared/components/action/Button';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import useLoginDialog, { LOGIN_DIALOG_DESCRIPTION } from '../../../shared/hooks/useLoginDialog';
import { useGlobalOverlay } from '../../../shared/providers/GlobalOverlayProvider';
import { colors } from '../../../shared/styles/color';
import { FONT } from '../../../shared/styles/fontType';
import { gap, padding } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';

import { REPORT_TARGET_TYPE } from '../../report/constants';

import { profileKeys } from '../api/profileKeys';
import ProfileCoverList from '../components/ProfileCoverList';
import ProfileUserRow from '../components/ProfileUserRow';
import useProfileFeedCovers from '../hooks/useProfileFeedCovers';

import UserProfileMoreBottomSheet from './components/UserProfileMoreBottomSheet';
import useFollowStatus from './hooks/useFollowStatus';
import useUserFollow from './hooks/useUserFollow';
import useUserProfile from './hooks/useUserProfile';

const USER_PROFILE_MORE_OVERLAY_ID = 'user-profile-more';

// 다른 사람 프로필. 이름 + 사용자 정보 + 팔로우 버튼 + 그 사람이 프로필에 올린 노래 커버.
// 이용 제한된 회원이면 닉네임·아이디를 fgDisabled 로, 사진을 제한 이미지로, 팔로우 버튼을 Disabled 로 바꾸고
// 게시물 대신 Empty 를 보여준다 (서버도 게시물을 빈 목록으로 준다)
// route params: { userId } (프로필 주인의 publicId)
const UserProfileScreen = () => {
  const navigation = useNavigation();
  const { params } = useRoute();
  const ownerId = params?.userId;

  const { userId } = useCurrentUser();
  const insets = useSafeAreaInsets();
  const { openOverlay } = useGlobalOverlay();
  const { requireLogin } = useLoginDialog();
  const { user } = useUserProfile({ ownerId });
  const { followStatus } = useFollowStatus({ userId, ownerId });
  const coverQuery = useProfileFeedCovers({
    ownerId,
    queryKey: profileKeys.userCovers(userId, ownerId),
  });

  const { toggleFollow, isTargetPending } = useUserFollow({ userId });

  const isRestricted = Boolean(user?.isRestricted);
  const isFollowing = Boolean(followStatus?.isFollowing);
  // 팔로우해야 하면 '팔로우'(Solid), 팔로우 중이면 '팔로잉'(Ghost). 피드 ProfileBar 와 같다
  const followVariant = isFollowing ? BUTTON_VARIANT.GHOST : BUTTON_VARIANT.SOLID;
  const followLabel = isFollowing ? '팔로잉' : '팔로우';
  // 팔로우 상태를 받기 전에는 '팔로우' → '팔로잉'으로 바뀌어 보이지 않게 자리만 잡아 둔다
  const isFollowStatusLoaded = followStatus != null;

  const handlePressFollow = useCallback(() => {
    toggleFollow(ownerId, isFollowing);
  }, [toggleFollow, ownerId, isFollowing]);

  const handlePressMore = useCallback(() => {
    openOverlay({
      id: USER_PROFILE_MORE_OVERLAY_ID,
      accessibilityLabel: '더보기 닫기',
      contentContainerStyle: styles.moreOverlay,
      renderContent: ({ close }) => (
        <UserProfileMoreBottomSheet
          onPressReport={() => {
            close();

            // 신고 화면은 로그인해야 들어갈 수 있다
            if (!requireLogin(LOGIN_DIALOG_DESCRIPTION.REPORT)) return;

            // 사용자 신고는 publicId 로 하고, 미리보기 없이 아이디 · 프로필 사진만 보여준다
            navigation.navigate('Report', {
              type: REPORT_TARGET_TYPE.USER,
              targetId: ownerId,
              userCode: user?.userCode,
              profileImageUrl: user?.profileImageUri,
              // 돌아와서 띄우는 신고 결과 토스트를 안드로이드 하단 네비게이션 바 위에 둔다
              toastBottomOffset: insets.bottom,
            });
          }}
          // TODO: 사용자 차단
          onPressBlock={close}
          onClose={close}
        />
      ),
    });
  }, [openOverlay, navigation, ownerId, requireLogin, user, insets.bottom]);

  const header = (
    <>
      <View style={styles.nicknameArea}>
        <Text
          numberOfLines={1}
          accessibilityRole="header"
          style={[styles.nickname, isRestricted && styles.restrictedText]}
        >
          {user?.nickname ?? ''}
        </Text>
      </View>

      <ProfileUserRow
        imageUri={user?.profileImageUri}
        userCode={user?.userCode}
        // 제한된 계정은 팔로우 여부와 상관없이 아이디를 Ghost + fgDisabled 로 보여준다
        isFollowing={!isRestricted && isFollowing}
        isRestricted={isRestricted}
      />

      {/* 이용 제한된 계정은 팔로우할 수 없어 Disabled 버튼으로 알린다 */}
      {isRestricted && (
        <View style={styles.actionRow}>
          <View style={styles.followButton}>
            <Button
              variant={BUTTON_VARIANT.DISABLED}
              size={BUTTON_SIZE.L}
              font={FONT.SUIT}
              style={styles.followButtonInner}
            >
              이용이 제한된 계정이에요
            </Button>
          </View>
        </View>
      )}

      {/* 내 프로필이면 팔로우 버튼이 없다 */}
      {!isRestricted && !followStatus?.isMe && (
        <View
          style={styles.actionRow}
          pointerEvents={isFollowStatusLoaded ? 'auto' : 'none'}
        >
          <View style={[styles.followButton, !isFollowStatusLoaded && styles.hidden]}>
            <Button
              variant={followVariant}
              size={BUTTON_SIZE.L}
              font={FONT.SUIT}
              disabled={isTargetPending(ownerId)}
              showDisabledStyle={false}
              onPress={handlePressFollow}
              accessibilityLabel={`${user?.nickname ?? '사용자'} ${followLabel}`}
              style={styles.followButtonInner}
            >
              {followLabel}
            </Button>
          </View>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <TopSubNavigation
        leftIcon={IcArrowLeft}
        leftAccessibilityLabel="뒤로가기"
        onPressClose={navigation.goBack}
        showShare={false}
        // 내 프로필이거나 이용 제한된 계정이면 케밥을 숨긴다
        showMore={!followStatus?.isMe && !isRestricted}
        onPressMore={handlePressMore}
      />

      {isRestricted ? (
        // 게시물은 모두 숨기고 남은 자리 가운데에 Empty 를 둔다
        <View style={styles.restrictedBody}>
          {header}
          <View style={styles.emptyContainer}>
            <Empty
              type="restricted"
              title="게시물을 볼 수 없어요"
              body="운영정책에 따라 이 계정의 게시물이 가려졌어요."
            />
          </View>
        </View>
      ) : (
        // TopSubNavigation 아래 전체(이름 + 프로필 정보 + 커버 그리드)가 함께 스크롤된다
        <ProfileCoverList header={header} {...coverQuery} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgSurface,
  },

  nicknameArea: {
    width: '100%',
    paddingTop: padding.M,
    paddingBottom: padding.M,
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.XS,
    backgroundColor: colors.bgSurface,
  },

  nickname: {
    ...typo.suitTitleMediumStrong,
    // 긴 닉네임은 한 줄에서 말줄임
    flexShrink: 1,
    color: colors.fgNeutralPrimary,
    textAlign: 'justify',
  },

  restrictedText: {
    color: colors.fgDisabled,
  },

  // ProfileCoverList 의 좌우 여백과 같게 둔다
  restrictedBody: {
    flex: 1,
    paddingHorizontal: padding.L,
  },

  emptyContainer: {
    flex: 1,
    alignSelf: 'stretch',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },

  actionRow: {
    paddingBottom: padding.M,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },

  // 내 프로필의 프로필 편집 + IconButton 자리 전체를 채운다
  followButton: {
    flex: 1,
  },

  followButtonInner: {
    alignSelf: 'stretch',
  },

  hidden: {
    opacity: 0,
  },

  // BottomSheet를 화면 전체 위에 띄운다
  moreOverlay: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
  },
});

export default UserProfileScreen;
