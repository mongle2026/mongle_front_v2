import React, { memo, useCallback, useState } from 'react';
import { StyleSheet, Text, View, } from 'react-native';

import ProfileImg from '../../atomic/ProfileImg';
import { TextButton } from '../../action/TextButton';

import { colors } from '../../../styles/color';
import { typo } from '../../../styles/typo';
import { gap, padding } from '../../../styles/token';
import { FONT, normalizeFont, } from '../../../styles/font';

const PROFILE_TYPE = Object.freeze({
  FEED: 'Feed',
  LETTER: 'Letter',
});

const USERNAME_ROTATION_DEGREE = -4;
const USERNAME_ROTATION_RADIAN =
  (Math.abs(USERNAME_ROTATION_DEGREE) * Math.PI) / 180;

/**
 * Feed Profile의 username 버튼은 중심 기준 -4도 회전합니다.
 * 회전 후 왼쪽 아래 끝점이 기존 하단보다 내려오는 만큼 계산합니다.
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
  type = PROFILE_TYPE.FEED,

  imageUri,

  // Feed
  imageSize = 'M',
  username,
  onPress,

  // Letter
  recipientName,

  // Common
  font,
  style,
  imageStyle,
  buttonStyle,
  textStyle,
}) => {
  const [endpointOffset, setEndpointOffset] = useState(0);

  const normalizedFont = normalizeFont(font);

  // Feed username에 이미 @가 들어와도 중복되지 않도록 제거합니다.
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

  /**
   * Letter
   */
  if (type === PROFILE_TYPE.LETTER) {
    const recipientText = String(recipientName ?? '').trim();

    const letterTextStyle =
      normalizedFont === FONT.SUIT
        ? typo.suitLabelLarge
        : typo.kyoboLabelLarge;

    return (
      <View
        style={[
          styles.letterContainer,
          style,
        ]}
      >
        <View
          style={[
            styles.letterImageArea,
            imageStyle,
          ]}
        >
          <ProfileImg
            imageUri={imageUri}
            size="S"
          />
        </View>

        <View style={styles.nicknameContainer}>
          <Text
            style={[
              letterTextStyle,
              styles.letterText,
              textStyle,
            ]}
          >
            {recipientText}
          </Text>

          <Text
            style={[
              letterTextStyle,
              styles.letterText,
              textStyle,
            ]}
          >
            에게
          </Text>
        </View>
      </View>
    );
  }

  /**
   * Feed
   */
  return (
    <View
      style={[
        styles.feedContainer,
        {
          paddingBottom: endpointOffset,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.feedImageArea,
          {
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
          font={font}
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
  // ── Feed ─────────────────────────────────────
  feedContainer: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: gap.S,

    backgroundColor: colors.bgLayerDefault,
  },

  feedImageArea: {
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

  // ── Letter ───────────────────────────────────
  letterContainer: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',

    paddingVertical: padding.M,
    paddingHorizontal: padding.L,

    gap: gap.S,

    backgroundColor: colors.bgLayerDefault,
  },

  letterImageArea: {
    flexShrink: 0,
  },

  nicknameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  letterText: {
    color: colors.fgNeutralSolid,
  },
});

export default memo(Profile);