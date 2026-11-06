import React, { memo } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import ProfileImg from '../atomic/ProfileImg';
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from '../action/Button';
import { FONT } from '../../styles/fontType';

import { colors } from '../../styles/color';
import { gap, padding, radius } from '../../styles/token';
import { typo } from '../../styles/typo';

export const LIST_ROW_TYPE = Object.freeze({
  RECIPIENT: 'recipient',
  MUSIC: 'music',
  // recipient 오른쪽에 버튼이 붙는다 (회전 없음)
  BUTTON: 'button',
});

const { RECIPIENT, MUSIC, BUTTON } = LIST_ROW_TYPE;

const DEFAULT_BUTTON_TEXT = '버튼';

const ListRow = ({
  type = RECIPIENT,
  isPressed = false,

  imageUri,

  // recipient
  nickname,
  userId,
  isMe = false,

  // button
  buttonText = DEFAULT_BUTTON_TEXT,
  onPressButton,

  // music
  title,
  artist,

  onPress,

  style,
}) => {
  const isButton = type === BUTTON;
  // button 타입도 닉네임 · @아이디를 쓴다
  const isRecipient = type === RECIPIENT || isButton;

  const primaryText = isRecipient
    ? nickname
    : title;

  const secondaryText = isRecipient
    ? userId
      ? `@${String(userId).replace(/^@/, '')}`
      : ''
    : artist;

  return (
    <View style={[styles.container, style]}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.sectionButton,
          (pressed || isPressed) &&
          styles.sectionButtonPressed,
        ]}
      >
        <ProfileImg
          imageUri={imageUri}
          size="L"
        />

        <View style={styles.textContainer}>
          <Text
            numberOfLines={1}
            style={styles.primaryText}
          >
            {primaryText}
          </Text>

          <Text
            numberOfLines={1}
            style={styles.secondaryText}
          >
            {secondaryText}
          </Text>
        </View>

        {type === RECIPIENT && isMe && (
          // 표시용 배지라 탭은 바깥 행으로 넘깁니다
          <View
            pointerEvents="none"
            style={styles.meButton}
          >
            <Button
              variant={BUTTON_VARIANT.SOLID}
              size={BUTTON_SIZE.S}
            >
              나에게
            </Button>
          </View>
        )}

        {isButton && (
          <Button
            variant={BUTTON_VARIANT.WEAK}
            size={BUTTON_SIZE.M}
            font={FONT.SUIT}
            onPress={onPressButton}
          >
            {buttonText}
          </Button>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: padding.XS,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },

  sectionButton: {
    width: '100%',
    padding: padding.L,
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.M,

    borderRadius: radius.XL,
    backgroundColor: colors.fillSurface,
  },

  sectionButtonPressed: {
    backgroundColor: colors.fillSurfacePress,
  },

  textContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.XS,
  },

  primaryText: {
    ...typo.suitLabelLargeStrong,
    color: colors.fgNeutralPrimary,
  },

  secondaryText: {
    ...typo.suitLabelMedium,
    alignSelf: 'stretch',
    color: colors.fgNeutralQuaternary,
  },

  meButton: {
    transform: [{ rotate: '-4deg' }],
  },
});

export default memo(ListRow);