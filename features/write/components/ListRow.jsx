import React, { memo } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import ProfileImg from '../../../shared/components/atomic/ProfileImg';
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from '../../../shared/components/action/Button';

import { colors } from '../../../shared/styles/color';
import { gap, padding, radius } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';

export const LIST_ROW_TYPE = Object.freeze({
  RECIPIENT: 'recipient',
  MUSIC: 'music',
});

const { RECIPIENT, MUSIC } = LIST_ROW_TYPE;

const ListRow = ({
  type = RECIPIENT,
  isPressed = false,

  imageUri,

  // recipient
  nickname,
  userId,
  isMe = false,

  // music
  title,
  artist,

  onPress,

  style,
}) => {
  const isRecipient = type === RECIPIENT;

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

        {isRecipient && isMe && (
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

    borderRadius: radius.M,
    backgroundColor: colors.bgSurface,
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