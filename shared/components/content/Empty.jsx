import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import IlEmptyComment from '../../../assets/illustrations/il_empty_comment.svg';
import IlEmptyRecipient from '../../../assets/illustrations/il_empty_recipient.svg';
import IlEmptyMusic from '../../../assets/illustrations/il_empty_music.svg';
import IlEmptyLetter from '../../../assets/illustrations/il_empty_letter.svg';

import {
  TextButton,
  TEXT_BUTTON_SIZE,
  TEXT_BUTTON_VARIANT,
} from '../action/TextButton';

import { colors } from '../../styles/color';
import { gap, padding } from '../../styles/token';
import { typo } from '../../styles/typo';
import { FONT } from '../../styles/fontType';

const Empty = ({
  type,
  title,
  body,

  /**
   * buttonLabel을 넘기지 않으면 버튼은 렌더되지 않습니다.
   * (버튼 없음이 기본)
   */
  buttonLabel,
  onButtonPress,
}) => {
  const getIllustration = () => {
    switch (type) {
      case 'comment':
        return IlEmptyComment;

      case 'recipient':
        return IlEmptyRecipient;

      case 'music':
        return IlEmptyMusic;

      case 'letter':
        return IlEmptyLetter;

      default:
        return null;
    }
  };

  const Illustration = getIllustration();

  return (
    <View style={styles.container}>
      {Illustration ? (
        <View style={styles.illustration}>
          <Illustration
            width="100%"
            height="100%"
          />
        </View>
      ) : null}

      <View style={styles.textContainer}>
        {title ? (
          <Text
            style={styles.title}
          >
            {title}
          </Text>
        ) : null}

        {body ? (
          <Text
            style={styles.body}
          >
            {body}
          </Text>
        ) : null}
      </View>

      {buttonLabel ? (
        <TextButton
          variant={TEXT_BUTTON_VARIANT.SOLID}
          size={TEXT_BUTTON_SIZE.M}
          font={FONT.SUIT}
          onPress={onButtonPress}
        >
          {buttonLabel}
        </TextButton>
      ) : null}
    </View>
  );
};

export default Empty;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: padding.XL,

    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',

    gap: gap.L,
  },

  illustration: {
    width: 200,
    height: 200,
    flexShrink: 0,
  },

  textContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: gap.XS,
  },

  title: {
    ...typo.suitTitleMediumStrong,

    color: colors.fgPlaceholder,
    textAlign: 'center',
  },

  body: {
    ...typo.suitBodyXLarge,

    color: colors.fgNeutralWeak,
    textAlign: 'center',
  },
});
