import React, { memo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import IcComment from '../../../../assets/icons/ic_comment.svg';
import IcKebab from '../../../../assets/icons/ic_kebab.svg';

import IconButton from '../../../../shared/components/action/IconButton';
import LabeledButton from '../../../../shared/components/action/LabeledButton';
import ProfileImg from '../../../../shared/components/atomic/ProfileImg';

import { colors } from '../../../../shared/styles/color';
import { gap, padding, radius } from '../../../../shared/styles/token';
import { typo } from '../../../../shared/styles/typo';

const Comment = ({
  userCode,
  comment,
  createdAt,
  profileImageUrl,
  depth = 0,
  onPressMenu,
  onPressReply,
  showMenu = true,
  isMenuOpen = false,
  style,
}) => {
  const isReply = depth > 0;
  const menuButtonRef = useRef(null);

  const normalizedUserCode = String(userCode ?? '').replace(/^@+/, '');

  const handlePressMenu = () => {
    menuButtonRef.current?.measureInWindow(
      (x, y, width, height) => {
        onPressMenu?.({
          x,
          y,
          width,
          height,
        });
      },
    );
  };

  return (
    <View
      style={[
        styles.container,
        isReply && styles.replyContainer,
        style,
      ]}
    >
      <View
        style={[
          styles.content,
          isMenuOpen && styles.menuOpenContent,
        ]}
      >
        <ProfileImg
          imageUri={profileImageUrl}
          size={isReply ? 'M' : 'L'}
        />

        <View style={styles.body}>
          <View style={styles.header}>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.userId}
            >
              @{normalizedUserCode}
            </Text>

            <Text style={styles.date}>
              {createdAt}
            </Text>

            {showMenu && (
              <View
                ref={menuButtonRef}
                collapsable={false}
                style={styles.menuButton}
              >
                <IconButton
                  size="S"
                  icon={
                    <IcKebab
                      width={14}
                      height={14}
                      color={colors.fgDeactivate}
                    />
                  }
                  onPress={handlePressMenu}
                  accessibilityLabel="댓글 메뉴"
                />
              </View>
            )}
          </View>

          <Text style={styles.comment}>
            {comment}
          </Text>

          <LabeledButton
            label="답글 달기"
            icon={<IcComment />}
            size="S"
            font="suit"
            color={colors.fgNeutralSubtlest}
            iconColor={colors.fgNeutralSubtlest}
            onPress={onPressReply}
            accessibilityLabel="답글 달기"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: padding.XS,
    paddingHorizontal: padding.M,
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: colors.bgLayerDefault,
  },

  replyContainer: {
    paddingTop: padding.S,
    paddingRight: padding.S,
    paddingBottom: padding.S,
    paddingLeft: 56,
  },

  content: {
    width: '100%',
    padding: padding.M,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: gap.M,
    borderRadius: radius.M,
    backgroundColor: colors.bgLayerDefault,
  },

  menuOpenContent: {
    backgroundColor: colors.bgLayerBasement,
  },

  body: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.S,
  },

  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.S,
  },

  userId: {
    ...typo.suitTitleSmall,
    flexShrink: 1,
    color: colors.fgNeutralSubtle,
  },

  date: {
    ...typo.suitLabelMedium,
    flex: 1,
    minWidth: 0,
    color: colors.fgNeutralSubtlest,
  },

  menuButton: {
    marginLeft: 'auto',
  },

  comment: {
    ...typo.suitBodyLarge,
    width: '100%',
    alignSelf: 'stretch',
    color: colors.fgNeutralMuted,
  },
});

export default memo(Comment);