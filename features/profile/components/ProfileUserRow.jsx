import { memo, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import ProfileImg from '../../../shared/components/atomic/ProfileImg';
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from '../../../shared/components/action/Button';
import { FONT } from '../../../shared/styles/fontType';
import { gap, padding } from '../../../shared/styles/token';

const USER_CODE_ROTATION_DEGREE = -4;
const USER_CODE_ROTATION_RADIAN = (Math.abs(USER_CODE_ROTATION_DEGREE) * Math.PI) / 180;

/**
 * userCode 버튼은 중심 기준 -4도 회전해서 오른쪽 위 꼭짓점은 원래 박스보다 위로,
 * 왼쪽 아래 꼭짓점은 같은 만큼 아래로 나간다. 레이아웃은 회전 전 박스로 잡히므로
 * 나간 만큼을 계산해 행 위·아래 여백에 더하고, ProfileImg 를 아래 꼭짓점 높이로 내린다.
 */
const getRotatedCornerOffset = (width, height) => {
  const widthOffset = (width / 2) * Math.sin(USER_CODE_ROTATION_RADIAN);
  const heightOffset = (height / 2) * (Math.cos(USER_CODE_ROTATION_RADIAN) - 1);

  return Math.max(0, Math.ceil(widthOffset + heightOffset));
};

// 프로필 사진 + 기울어진 @userCode 버튼 (내 프로필, 다른 사람 프로필 공용)
// 팔로우한 사람이면 userCode 버튼은 Solid, 아니면 Ghost (피드 ProfileBar 와 같다)
const ProfileUserRow = ({ imageUri, userCode, isFollowing = false }) => {
  const normalizedUserCode = String(userCode ?? '').replace(/^@+/, '');
  const userCodeVariant = isFollowing ? BUTTON_VARIANT.SOLID : BUTTON_VARIANT.GHOST;

  const [userCodeCornerOffset, setUserCodeCornerOffset] = useState(0);

  const handleUserCodeLayout = useCallback(e => {
    const { width, height } = e.nativeEvent.layout;
    setUserCodeCornerOffset(getRotatedCornerOffset(width, height));
  }, []);

  return (
    <View
      style={[
        styles.userRow,
        {
          paddingTop: userCodeCornerOffset,
          paddingBottom: padding.M + userCodeCornerOffset,
        },
      ]}
    >
      {/* 회전한 버튼의 가장 아래 꼭짓점과 같은 줄에 오도록 내린다 */}
      <ProfileImg
        imageUri={imageUri}
        size="M"
        style={[styles.profileImg, { transform: [{ translateY: userCodeCornerOffset }] }]}
      />

      {/* onLayout 은 회전 전 크기를 주므로 감싼 View 에서 측정한다 */}
      <View onLayout={handleUserCodeLayout}>
        <Button
          variant={userCodeVariant}
          size={BUTTON_SIZE.M}
          font={FONT.SUIT}
          style={styles.userCodeButton}
        >
          {`@${normalizedUserCode}`}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  userRow: {
    paddingBottom: padding.M,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: gap.S,
    alignSelf: 'stretch',
  },

  // ProfileImg 사이즈 프리셋을 덮어쓴다
  profileImg: {
    width: 35,
    height: 35,
  },

  // 회전은 border를 가진 Button 자신에게 걸고, overflow: 'hidden'으로 iOS 계단 현상을 막는다 (Profile 과 동일)
  userCodeButton: {
    overflow: 'hidden',
    transform: [{ rotate: `${USER_CODE_ROTATION_DEGREE}deg` }],
  },
});

export default memo(ProfileUserRow);
