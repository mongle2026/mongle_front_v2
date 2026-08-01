import React, { memo } from 'react';
import { StyleSheet, Text, View, } from 'react-native';

import CommentIcon from '../../../../assets/icons/ic_comment.svg';

import ProfileImg from '../../../../shared/atomic/ProfileImg';
import LabeledButton from '../../../../shared/atomic/LabeledButton';

import { colors } from '../../../../shared/styles/color';
import { gap, padding, radius, } from '../../../../shared/styles/token';
import { typo } from '../../../../shared/styles/typo';

const REPLY_PADDING_LEFT = 56;

const Comment = ({
  profileImageUri,
  userId,
  createdAtLabel,
  content,
  isReply = false,
  onPressReply,
  style,
}) => {
  return (
    <View
      style={[
        styles.wrapper,
        isReply && styles.replyWrapper,
        style,
      ]}
    >
      <View style={styles.container}>
        <ProfileImg
          imageUri={profileImageUri}
          size="L"
        />

        <View style={styles.contentContainer}>
          <View style={styles.metaContainer}>
            <Text
              numberOfLines={1}
              style={styles.userId}
            >
              {userId}
            </Text>

            <Text
              numberOfLines={1}
              style={styles.createdAt}
            >
              {createdAtLabel}
            </Text>
          </View>

          <Text style={styles.content}>
            {content}
          </Text>

          <LabeledButton
            label="답글 달기"
            icon={<CommentIcon />}
            size="S"
            font="suit"
            color={colors.fgNeutralSubtlest}
            iconColor={colors.fgNeutralSubtlest}
            accessibilityLabel={`${userId}님 댓글에 답글 달기`}
            onPress={onPressReply}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    padding: padding.S,
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: colors.bgLayerDefault,
  },

  /*
   * 답글의 실제 깊이와 상관없이 모든 답글에
   * 동일한 왼쪽 여백을 적용합니다.
   */
  replyWrapper: {
    paddingLeft: REPLY_PADDING_LEFT,
  },

  container: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: gap.M,
    padding: padding.M,
    borderRadius: radius.M,
  },

  contentContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.S,
    minWidth: 0,
  },

  metaContainer: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.S,
  },

  userId: {
    ...typo.suitTitleSmall,
    flexShrink: 1,
    color: colors.fgNeutralSubtle,
  },

  createdAt: {
    ...typo.suitLabelMedium,
    flex: 1,
    color: colors.fgNeutralSubtlest,
  },

  content: {
    ...typo.suitBodyLarge,
    alignSelf: 'stretch',
    color: colors.fgNeutralMuted,
  },
});

export default memo(Comment);