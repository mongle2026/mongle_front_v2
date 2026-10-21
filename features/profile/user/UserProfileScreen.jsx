import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import IcArrowLeft from '../../../assets/icons/ic_arrow_left.svg';

import TopSubNavigation from '../../../shared/components/navigation/topnavigation/TopSubNavigation';
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from '../../../shared/components/action/Button';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import { colors } from '../../../shared/styles/color';
import { FONT } from '../../../shared/styles/fontType';
import { gap, padding } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';

import { profileKeys } from '../api/profileKeys';
import ProfileCoverList from '../components/ProfileCoverList';
import ProfileUserRow from '../components/ProfileUserRow';
import useProfileFeedCovers from '../hooks/useProfileFeedCovers';

import useFollowStatus from './hooks/useFollowStatus';
import useUserFollow from './hooks/useUserFollow';
import useUserProfile from './hooks/useUserProfile';

// 다른 사람 프로필. 이름 + 사용자 정보 + 팔로우 버튼 + 그 사람이 프로필에 올린 노래 커버.
// route params: { userId } (프로필 주인의 publicId)
const UserProfileScreen = () => {
  const navigation = useNavigation();
  const { params } = useRoute();
  const ownerId = params?.userId;

  const { userId } = useCurrentUser();
  const { user } = useUserProfile({ ownerId });
  const { followStatus } = useFollowStatus({ userId, ownerId });
  const coverQuery = useProfileFeedCovers({
    ownerId,
    queryKey: profileKeys.userCovers(userId, ownerId),
  });

  const { toggleFollow, isTargetPending } = useUserFollow({ userId });

  const isFollowing = Boolean(followStatus?.isFollowing);
  // 팔로우해야 하면 '팔로우'(Solid), 팔로우 중이면 '팔로잉'(Ghost). 피드 ProfileBar 와 같다
  const followVariant = isFollowing ? BUTTON_VARIANT.GHOST : BUTTON_VARIANT.SOLID;
  const followLabel = isFollowing ? '팔로잉' : '팔로우';
  // 팔로우 상태를 받기 전에는 '팔로우' → '팔로잉'으로 바뀌어 보이지 않게 자리만 잡아 둔다
  const isFollowStatusLoaded = followStatus != null;

  const handlePressFollow = useCallback(() => {
    toggleFollow(ownerId, isFollowing);
  }, [toggleFollow, ownerId, isFollowing]);

  const header = (
    <>
      <View style={styles.nicknameArea}>
        <Text numberOfLines={1} accessibilityRole="header" style={styles.nickname}>
          {user?.nickname ?? ''}
        </Text>
      </View>

      <ProfileUserRow
        imageUri={user?.profileImageUri}
        userCode={user?.userCode}
        isFollowing={isFollowing}
      />

      {/* 내 프로필이면 팔로우 버튼이 없다 */}
      {!followStatus?.isMe && (
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
        showMore={false}
      />

      {/* TopSubNavigation 아래 전체(이름 + 프로필 정보 + 커버 그리드)가 함께 스크롤된다 */}
      <ProfileCoverList header={header} {...coverQuery} />
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
});

export default UserProfileScreen;
