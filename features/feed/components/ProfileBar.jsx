import React, { memo, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import Profile from '../../../shared/components/content/profile/Profile';
import { BUTTON_VARIANT, Button } from '../../../shared/components/action/Button';
import { DividerLine } from '../../../shared/components/atomic/DividerLine';

import { colors } from '../../../shared/styles/color';
import { gap, padding } from '../../../shared/styles/token';

/*
 * 팔로우 버튼 인터랙션
 * - 누르는 동안 살짝 눌린다
 * - 팔로우가 되면 한 번 톡 튀고(햅틱), 팔로우를 끊으면 가볍게만 반응한다
 * - 팔로우 ↔ 팔로잉 색 · 글자 전환은 Button 의 variant 크로스페이드가 맡는다
 */
const PRESSED_SCALE = 0.94;
const FOLLOW_POP_SCALE = 1.12;
const FOLLOW_POP_SPRING = { damping: 9, stiffness: 260 };

const playHaptic = isFollow => {
  const haptic = isFollow
    ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    : Haptics.selectionAsync();

  void haptic.catch(() => {
    /* 햅틱을 지원하지 않는 환경에서도 팔로우는 그대로 동작한다 */
  });
};

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
  const profileVariant = isFollowing ? BUTTON_VARIANT.SOLID : BUTTON_VARIANT.GHOST;
  const followVariant = isFollowing ? BUTTON_VARIANT.GHOST : BUTTON_VARIANT.SOLID;
  const followLabel = isFollowing ? '팔로잉' : '팔로우';

  const followScale = useSharedValue(1);
  const prevIsFollowingRef = useRef(isFollowing);

  // 팔로우 상태가 실제로 바뀌었을 때(낙관적 업데이트 포함) 반응한다. 처음 그릴 때는 가만히 둔다
  useEffect(() => {
    if (prevIsFollowingRef.current === isFollowing) return;
    prevIsFollowingRef.current = isFollowing;

    if (isFollowing) {
      followScale.value = withSequence(
        withTiming(FOLLOW_POP_SCALE, { duration: 120, easing: Easing.out(Easing.quad) }),
        withSpring(1, FOLLOW_POP_SPRING),
      );
    }
  }, [isFollowing, followScale]);

  const followButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: followScale.value }],
  }));

  const handleFollowPressIn = useCallback(() => {
    followScale.value = withTiming(PRESSED_SCALE, { duration: 90 });
  }, [followScale]);

  const handleFollowPressOut = useCallback(() => {
    followScale.value = withSpring(1, FOLLOW_POP_SPRING);
  }, [followScale]);

  // 햅틱은 직접 누른 버튼에서만 낸다 (같은 사람의 카드가 여러 장이면 모두 상태가 바뀌므로)
  const handlePressFollow = useCallback(
    (...args) => {
      playHaptic(!isFollowing);
      onPressFollow?.(...args);
    },
    [isFollowing, onPressFollow],
  );

  return (
    <View style={styles.profileBar}>
      <View style={styles.container}>
        <Profile
          imageUri={imageUri}
          imageSize="S"
          username={username}
          font={font}
          variant={profileVariant}
          onPress={onPressProfile}
        />

        {showFollowButton && (
          <Animated.View style={[styles.followButton, followButtonStyle]}>
            <Button
              variant={followVariant}
              font={font}
              disabled={followDisabled}
              showDisabledStyle={false}
              onPress={handlePressFollow}
              onPressIn={handleFollowPressIn}
              onPressOut={handleFollowPressOut}
              accessibilityLabel={`${username ?? '사용자'} ${followLabel}`}
            >
              {followLabel}
            </Button>
          </Animated.View>
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
    backgroundColor: colors.bgSurface,
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