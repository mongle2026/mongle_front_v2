import React, { memo, useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View, } from 'react-native';

import ProfileImg from '../../atomic/ProfileImg';
import FontFallbackText from '../../atomic/FontFallbackText';
import UsernameTag, { USERNAME_TAG_VARIANT } from './UsernameTag';

import { colors } from '../../../styles/color';
import { typo } from '../../../styles/typo';
import { gap, padding } from '../../../styles/token';
import { FONT, normalizeFont, } from '../../../styles/fontType';

const PROFILE_TYPE = Object.freeze({
  FEED: 'Feed',
  LETTER: 'Letter',
});

const USERNAME_ROTATION_DEGREE = -4;
const USERNAME_ROTATION_RADIAN =
  (Math.abs(USERNAME_ROTATION_DEGREE) * Math.PI) / 180;

/**
 * Feed Profile의 username 태그는 중심 기준 -4도 회전합니다.
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
  // 탈퇴한 회원이면 사진 대신 탈퇴 회원 이미지로 고정한다
  isWithdrawn = false,

  // 누르면 프로필로 이동. Feed 는 이미지 · username 태그, Letter 는 전체 영역
  onPress,

  // Feed
  username,
  // username 태그 variant. 팔로우한 사람은 Solid
  variant = USERNAME_TAG_VARIANT.GHOST,

  // Letter
  recipientName,
  // 이름 뒤에 붙는 말. 받는 이는 '에게', 보낸 이는 '이가'
  nameSuffix = '에게',

  // Common
  font,
  style,
  imageStyle,
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

    const LetterContainer = onPress ? Pressable : View;
    const letterContainerProps = onPress
      ? {
        onPress,
        accessibilityRole: 'button',
        accessibilityLabel: `${recipientText} 프로필 보기`,
      }
      : null;

    return (
      <LetterContainer
        {...letterContainerProps}
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
            isWithdrawn={isWithdrawn}
            size="S"
          />
        </View>

        <View style={styles.nicknameContainer}>
          <FontFallbackText
            style={[
              letterTextStyle,
              styles.letterText,
              isWithdrawn && styles.withdrawnLetterText,
              textStyle,
            ]}
          >
            {recipientText}
          </FontFallbackText>

          <Text
            style={[
              letterTextStyle,
              styles.letterText,
              textStyle,
            ]}
          >
            {nameSuffix}
          </Text>
        </View>
      </LetterContainer>
    );
  }

  /**
   * Feed
   */
  // 이미지는 username 태그와 같은 프로필로 이동한다. 스크린 리더는 username 태그만 읽는다
  const FeedImageArea = onPress ? Pressable : View;
  const feedImageAreaProps = onPress
    ? { onPress, accessible: false }
    : null;

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
      <FeedImageArea
        {...feedImageAreaProps}
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
          isWithdrawn={isWithdrawn}
          size="S"
        />
      </FeedImageArea>

      <View
        onLayout={handleUsernameLayout}
        style={styles.usernameTagArea}
      >
        <UsernameTag
          variant={variant}
          font={font}
          onPress={onPress}
          accessibilityLabel={`${profileId} 프로필 보기`}
          style={styles.usernameTag}
          textStyle={textStyle}
        >
          {profileId}
        </UsernameTag>
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

    backgroundColor: colors.bgSurface,
  },

  feedImageArea: {
    flexShrink: 0,
  },

  usernameTagArea: {
    alignSelf: 'flex-end',
    flexShrink: 0,
  },

  // 회전은 border를 가진 태그 자신에게 걸어야 합니다.
  usernameTag: {
    transform: [
      {
        rotate: `${USERNAME_ROTATION_DEGREE}deg`,
      },
    ],
  },

  // ── Letter ───────────────────────────────────
  letterContainer: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',

    paddingVertical: padding.M,
    paddingHorizontal: padding.L,

    gap: gap.S,

    backgroundColor: colors.bgSurface,
  },

  letterImageArea: {
    flexShrink: 0,
  },

  nicknameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  letterText: {
    color: colors.fgNeutralPrimary,
  },

  // 탈퇴한 회원 이름 '(탈퇴한 회원)'. 뒤에 붙는 말('이가')은 색을 바꾸지 않는다
  withdrawnLetterText: {
    color: colors.fgDisabled,
  },
});

export default memo(Profile);