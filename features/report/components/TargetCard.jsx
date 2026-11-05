import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import ProfileImg from '../../../shared/components/atomic/ProfileImg';

import { colors } from '../../../shared/styles/color';
import { gap, padding } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';
import { REPORT_TARGET_TYPE } from '../constants';

const toUserCode = userCode =>
  `@${String(userCode ?? '').replace(/^@+/, '')}`;

// 신고 대상 종류별 아이디 뒤에 붙는 문구. user는 미리보기를 보여주지 않는다
const TARGET_TITLE_SUFFIX = {
  [REPORT_TARGET_TYPE.FEED]: '님의 피드를 신고해요',
  [REPORT_TARGET_TYPE.COMMENT]: '님의 댓글을 신고해요',
  [REPORT_TARGET_TYPE.LETTER]: '님의 편지를 신고해요',
  [REPORT_TARGET_TYPE.USER]: '님을 신고해요',
};

const TargetCard = ({
  type,
  // 신고 대상 아이디
  userCode,
  // 신고 대상 프로필 이미지
  profileImageUrl,
  // feed/comment/letter: 신고하는 피드 · 댓글 · 편지 내용
  preview,
  style,
}) => {
  const titleSuffix = TARGET_TITLE_SUFFIX[type];
  if (!titleSuffix) return null;

  const showPreview = type !== REPORT_TARGET_TYPE.USER && !!preview;

  return (
    <View style={[styles.container, style]}>
      <ProfileImg imageUri={profileImageUrl} />

      <View style={styles.textContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            <Text style={styles.userCode}>{toUserCode(userCode)}</Text>
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
    ...typo.suitBodyMedium,
    flexShrink: 1,
    color: colors.fgNeutralPrimary,
  },
  userCode: {
    ...typo.suitTitleSmallStrong,
  },
  preview: {
    ...typo.suitBodySmall,
    alignSelf: 'stretch',
    color: colors.fgNeutralTertiary,
  },
});

export default memo(TargetCard);
