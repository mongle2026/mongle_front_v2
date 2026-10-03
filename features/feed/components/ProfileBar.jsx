import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import Profile from '../../../shared/components/content/profile/Profile';
import { TEXT_BUTTON_VARIANT, TextButton } from '../../../shared/components/action/TextButton';
import { DividerLine } from '../../../shared/components/atomic/DividerLine';

import { colors } from '../../../shared/styles/color';
import { gap, padding } from '../../../shared/styles/token';

const ProfileBar = ({
  imageUri,
  username,
  font = 'kyobo',
  // 팔로우한 사람이면 username 버튼은 Solid, 팔로우 버튼은 '팔로잉'(Ghost)
  isFollowing = false,

  showFollowButton = true,
  followDisabled = false,

  onPressProfile,
  onPressFollow,
}) => {
  const profileVariant = isFollowing ? TEXT_BUTTON_VARIANT.SOLID : TEXT_BUTTON_VARIANT.GHOST;
  const followVariant = isFollowing ? TEXT_BUTTON_VARIANT.GHOST : TEXT_BUTTON_VARIANT.SOLID;
  const followLabel = isFollowing ? '팔로잉' : '팔로우';

  return (
    <View style={styles.profileBar}>
      <View style={styles.container}>
        <Profile
          imageUri={imageUri}
          imageSize="M"
          username={username}
          font={font}
          variant={profileVariant}
          onPress={onPressProfile}
        />

        {showFollowButton && (
          <TextButton
            variant={followVariant}
            font={font}
            disabled={followDisabled}
            showDisabledStyle={false}
            onPress={onPressFollow}
            accessibilityLabel={`${username ?? '사용자'} ${followLabel}`}
            style={styles.followButton}
          >
            {followLabel}
          </TextButton>
        )}
      </View>

      <View style={styles.dividerArea}>
        <DividerLine />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileBar: {
    width: '100%',
    alignSelf: 'stretch',
    flexShrink: 0,
    paddingHorizontal: padding.L,
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: colors.bgLayerDefault,
  },

  container: {
    width: '100%',
    alignSelf: 'stretch',
    flexShrink: 0,
    paddingTop: padding.M,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  followButton: {
    width: 'auto',
    alignSelf: 'flex-end',
    flexShrink: 0,
  },

  dividerArea: {
    width: '100%',
    marginTop: gap.M,
  },
});

export default memo(ProfileBar);