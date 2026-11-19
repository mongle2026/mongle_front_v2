import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import ProfileImg from '../../../shared/components/atomic/ProfileImg';

import { colors } from '../../../shared/styles/color';
import { gap, padding, radius } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';
import {
  OWN_TARGET_TYPES,
  REPORT_TARGET_TYPE,
  TARGET_CARD_VARIANT,
} from '../constants';

const toUserCode = userCode =>
  `@${String(userCode ?? '').replace(/^@+/, '')}`;

// 문구 종류 · 신고 대상 종류별 아이디(굵게) 뒤에 붙는 문구
const TITLE_SUFFIX = {
  [TARGET_CARD_VARIANT.REPORT]: {
    [REPORT_TARGET_TYPE.FEED]: '님의 피드를 신고해요',
    [REPORT_TARGET_TYPE.COMMENT]: '님의 댓글을 신고해요',
    [REPORT_TARGET_TYPE.LETTER]: '님의 편지를 신고해요',
    [REPORT_TARGET_TYPE.USER]: '님을 신고해요',
  },
  [TARGET_CARD_VARIANT.REPORTER]: {
    [REPORT_TARGET_TYPE.FEED]: '님의 피드를 신고했어요',
    [REPORT_TARGET_TYPE.COMMENT]: '님의 댓글을 신고했어요',
    [REPORT_TARGET_TYPE.LETTER]: '님의 편지를 신고했어요',
    [REPORT_TARGET_TYPE.USER]: '님을 신고했어요',
  },
  // 피드(OWN_TARGET_TYPES)는 아이디 없이 문구만 보여준다. 계정은 신고당한 내 아이디를 보여준다
  [TARGET_CARD_VARIANT.REPORTED]: {
    [REPORT_TARGET_TYPE.FEED]: '내가 올린 피드',
    [REPORT_TARGET_TYPE.COMMENT]: '님의 피드에 남긴 댓글',
    [REPORT_TARGET_TYPE.LETTER]: '님에게 보낸 편지',
    [REPORT_TARGET_TYPE.USER]: ' · 내 계정',
  },
};

const TargetCard = ({
  variant = TARGET_CARD_VARIANT.REPORT,
  type,
  // REPORT · REPORTER: 신고 대상 아이디
  // REPORTED: 댓글을 단 피드의 작성자 · 편지를 받은 사람 아이디, 계정은 신고당한 내 아이디 (피드는 쓰지 않는다)
  userCode,
  // REPORT · REPORTER: 신고 대상 프로필 이미지, REPORTED: 내 프로필 이미지
  profileImageUrl,
  // feed/comment/letter: 신고한 피드 · 댓글 · 편지 내용. user는 미리보기를 보여주지 않는다
  preview,
  style,
}) => {
  const titleSuffix = TITLE_SUFFIX[variant]?.[type];
  if (!titleSuffix) return null;

  const showUserCode = !(
    variant === TARGET_CARD_VARIANT.REPORTED && OWN_TARGET_TYPES.includes(type)
  );
  const showPreview = type !== REPORT_TARGET_TYPE.USER && !!preview;

  return (
    <View style={[styles.container, style]}>
      <ProfileImg imageUri={profileImageUrl} />

      <View style={styles.textContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {showUserCode ? (
              <Text style={styles.userCode}>{toUserCode(userCode)}</Text>
            ) : null}
            {titleSuffix}
          </Text>
        </View>

        {showPreview ? (
          <Text style={styles.preview} numberOfLines={1} ellipsizeMode="tail">
            {preview}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: padding.M,
    paddingHorizontal: padding.L,
    gap: gap.M,
    borderRadius: radius.S,
    backgroundColor: colors.fillNeutralWeak,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.XS,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },
  title: {
    ...typo.suitBodySmall400,
    flexShrink: 1,
    color: colors.fgNeutralPrimary,
  },
  userCode: {
    ...typo.suitBodySmall600,
  },
  preview: {
    ...typo.suitCaptionMedium400,
    alignSelf: 'stretch',
    color: colors.fgNeutralTertiary,
  },
});

export default memo(TargetCard);
