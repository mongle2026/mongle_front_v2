import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import IlEmptyComment from '../../../assets/illustrations/il_empty_comment.svg';
import IlEmptyRecipient from '../../../assets/illustrations/il_empty_recipient.svg';
import IlEmptyMusic from '../../../assets/illustrations/il_empty_music.svg';
import IlEmptyLetter from '../../../assets/illustrations/il_empty_letter.svg';
import IlEmptyArchive from '../../../assets/illustrations/il_empty_archive.svg';
import IlEmptyNotification from '../../../assets/illustrations/il_empty_notification.svg';
import IlEmptyBookmark from '../../../assets/illustrations/il_empty_bookmark.svg';
import IlEmptyLogin from '../../../assets/illustrations/il_empty_login.svg';
import IlEmptyFollowingFeed from '../../../assets/illustrations/il_empty_followingfeed.svg';
import IlEmptyRestricted from '../../../assets/illustrations/il_empty_restricted.svg';
import IlEmptyBlock from '../../../assets/illustrations/il_empty_block.svg';
import IcFilledAlert from '../../../assets/icons/ic_filledalert.svg';

import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from '../action/Button';

import { colors } from '../../styles/color';
import { gap, padding } from '../../styles/token';
import { typo } from '../../styles/typo';
import { FONT } from '../../styles/fontType';

const ALERT_ICON_SIZE = 24;

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

      case 'archive':
        return IlEmptyArchive;

      case 'notification':
        return IlEmptyNotification;

      case 'bookmark':
        return IlEmptyBookmark;

      case 'login':
        return IlEmptyLogin;

      case 'followingFeed':
        return IlEmptyFollowingFeed;

      // 운영정책에 따라 가려진 피드 · 편지
      case 'restricted':
        return IlEmptyRestricted;

      // 내가 차단한 사용자의 프로필
      case 'block':
        return IlEmptyBlock;

      default:
        return null;
    }
  };

  const Illustration = getIllustration();

  // 계정 이용 제한처럼 경고로 알릴 때. 일러스트 대신 경고 아이콘을 쓰고 제목을 강조색으로 쓴다
  const isAlert = type === 'alert';

  return (
    <View style={[styles.container, isAlert && styles.alertContainer]}>
      {isAlert ? (
        <IcFilledAlert
          width={ALERT_ICON_SIZE}
          height={ALERT_ICON_SIZE}
          color={colors.fgCritical}
        />
      ) : null}

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
            style={[styles.title, isAlert && styles.alertTitle]}
          >
            {title}
          </Text>
        ) : null}

        {body ? (
          <Text
            style={[styles.body, isAlert && styles.alertBody]}
          >
            {body}
          </Text>
        ) : null}
      </View>

      {buttonLabel ? (
        <Button
          variant={BUTTON_VARIANT.SOLID}
          size={BUTTON_SIZE.M}
          font={FONT.SUIT}
          onPress={onButtonPress}
          style={styles.button}
        >
          {buttonLabel}
        </Button>
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
    ...typo.suitTitleSmall,

    color: colors.fgNeutralTertiary,
    textAlign: 'center',
  },

  body: {
    ...typo.suitBodyLarge400,

    color: colors.fgNeutralQuaternary,
    textAlign: 'center',
  },

  alertContainer: {
    gap: gap.M,
  },

  alertTitle: {
    color: colors.fgCritical,
  },

  alertBody: {
    color: colors.fgNeutralTertiary,
  },

  // Button 기본 alignSelf(flex-start)를 덮어써 가운데 정렬
  button: {
    alignSelf: 'center',
  },
});
