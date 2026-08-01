import React, { memo } from 'react';
import { StyleSheet, Text, View,} from 'react-native';

import IcBookmarkFill from '../../../../assets/icons/ic_bookmark_fill.svg';
import IcBookmarkStroke from '../../../../assets/icons/ic_bookmark_stroke.svg';
import IcComment from '../../../../assets/icons/ic_comment.svg';
import IcHeartFill from '../../../../assets/icons/ic_heart_fill.svg';
import IcHeartStroke from '../../../../assets/icons/ic_heart_stroke.svg';

import AnimatedLabeledButton, {
  ANIMATION_TYPE,
} from '../../../../shared/atomic/AnimatedLabeledButton';

import LabeledButton from '../../../../shared/atomic/LabeledButton';

import { colors } from '../../../../shared/styles/color';
import { gap, padding } from '../../../../shared/styles/token';
import { typo } from '../../../../shared/styles/typo';
import { formatDateDetail } from '../../../../shared/utils/formatDate';

const ActionBar = ({
  createdAt,
  isLiked = false,
  isBookmarked = false,
  likeButtonRef,
  onCommentPress,
  onLikePress,
  onBookmarkPress,
  style,
}) => {
  const formattedDate = createdAt
    ? formatDateDetail(createdAt)
    : '';

  return (
    <View style={[styles.container, style]}>
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={styles.date}
      >
        {formattedDate}
      </Text>

      <View style={styles.actions}>
        <LabeledButton
          size="S"
          icon={<IcComment />}
          iconColor={colors.fgDeactivate}
          onPress={onCommentPress}
          accessibilityLabel="댓글"
          style={styles.actionButton}
        />

        <AnimatedLabeledButton
          ref={likeButtonRef}
          size="S"
          isActive={isLiked}
          activeIcon={IcHeartFill}
          inactiveIcon={IcHeartStroke}
          activeColor={colors.fgLike}
          inactiveColor={colors.fgDeactivate}
          animationType={ANIMATION_TYPE.LIKE}
          onPress={onLikePress}
          accessibilityLabel={
            isLiked ? '좋아요 취소' : '좋아요'
          }
          style={styles.actionButton}
        />

        <AnimatedLabeledButton
          size="S"
          isActive={isBookmarked}
          activeIcon={IcBookmarkFill}
          inactiveIcon={IcBookmarkStroke}
          activeColor={colors.fgBookmark}
          inactiveColor={colors.fgDeactivate}
          animationType={ANIMATION_TYPE.BOOKMARK}
          onPress={onBookmarkPress}
          accessibilityLabel={
            isBookmarked
              ? '북마크 해제'
              : '북마크'
          }
          style={styles.actionButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: padding.S,
    paddingHorizontal: padding.L,
    backgroundColor: colors.bgLayerDefault,
  },

  date: {
    ...typo.suitLabelMedium,
    flex: 1,
    minWidth: 0,
    color: colors.fgPlaceholder,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: gap.M,
  },

  actionButton: {
    alignSelf: 'center',
  },
});

export default memo(ActionBar);