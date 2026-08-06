import React, { memo, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import ProfileImg from '../../atomic/ProfileImg';
import { TextButton } from '../../action/TextButton';

import { colors } from '../../../styles/color';
import { gap } from '../../../styles/token';
import { typo } from '../../../styles/typo';

const USERNAME_ROTATION_DEGREE = -4;
const USERNAME_ROTATION_RADIAN =
  (Math.abs(USERNAME_ROTATION_DEGREE) * Math.PI) / 180;

/**
 * 버튼은 중심을 기준으로 -4도 회전합니다.
 * 회전 후 왼쪽 아래 끝점이 기존 하단보다 내려오는 만큼을 계산합니다.
 */
const getRotatedEndpointOffset = (width, height) => {
  const widthOffset =
    (width / 2) * Math.sin(USERNAME_ROTATION_RADIAN);

  const heightOffset =
    (height / 2) *
    (Math.cos(USERNAME_ROTATION_RADIAN) - 1);

  return Math.max(
    0,
    Math.round(widthOffset + heightOffset),
  );
};

const Profile = ({
  imageUri,
  imageSize = 'M',
  username,
  onPress,
  style,
  imageStyle,
  buttonStyle,
  textStyle,
}) => {
  const [endpointOffset, setEndpointOffset] = useState(0);

  // username에 이미 @가 들어와도 중복되지 않도록 제거합니다.
  const normalizedUsername = String(username ?? '').replace(/^@+/, '');
  const profileId = `@${normalizedUsername}`;

  const handleUsernameLayout = useCallback((event) => {
    const { width, height } = event.nativeEvent.layout;
    const nextOffset = getRotatedEndpointOffset(width, height);

    setEndpointOffset((currentOffset) => {
      if (currentOffset === nextOffset) {
        return currentOffset;
      }

      return nextOffset;
    });
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          // 회전된 버튼과 이미지가 내려오는 영역을 실제 높이에 포함합니다.
          paddingBottom: endpointOffset,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.imageArea,
          {
            // 이미지 하단을 회전된 버튼의 왼쪽 아래 끝점에 맞춥니다.
            transform: [
              {
                translateY: endpointOffset,
              },
            ],
          },
          imageStyle,
        ]}
      >
        <ProfileImg
          imageUri={imageUri}
          size={imageSize}
        />
      </View>

      <View
        onLayout={handleUsernameLayout}
        style={styles.usernameButtonArea}
      >
        <TextButton
          variant="Ghost"
          typography={typo.kyoboLabelLarge}
          onPress={onPress}
          accessibilityLabel={`${profileId} 프로필 보기`}
          style={[
            styles.usernameButton,
            buttonStyle,
          ]}
          textStyle={textStyle}
        >
          {profileId}
        </TextButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: gap.S,

    backgroundColor: colors.bgLayerDefault,
  },

  imageArea: {
    flexShrink: 0,
  },

  usernameButtonArea: {
    alignSelf: 'flex-end',
    flexShrink: 0,

    transform: [
      {
        rotate: `${USERNAME_ROTATION_DEGREE}deg`,
      },
    ],
  },

  usernameButton: {
    // TextButton의 기본 width: '100%'를 덮어씁니다.
    width: 'auto',
  },
});

export default memo(Profile);