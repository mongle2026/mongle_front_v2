import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import IcBookmarkFill from '../../../../assets/icons/ic_bookmark_fill.svg';
import IcBookmarkStroke from '../../../../assets/icons/ic_bookmark_stroke.svg';
import IcComment from '../../../../assets/icons/ic_comment.svg';
import IcHeartFill from '../../../../assets/icons/ic_heart_fill.svg';
import IcHeartStroke from '../../../../assets/icons/ic_heart_stroke.svg';

import AnimatedLabeledButton, {
  ANIMATION_TYPE,
} from '../../../../shared/components/action/AnimatedLabeledButton';
import LabeledButton from '../../../../shared/components/action/LabeledButton';

import { colors } from '../../../../shared/styles/color';
import { padding } from '../../../../shared/styles/token';
import { typo } from '../../../../shared/styles/typo';
import { formatDateDetail } from '../../utils/formatDate';

const ActionBar = ({
  createdAt,
  isLiked = false,
  isBookmarked = false,
  bookmarkCount,

  likeDisabled = false,
  bookmarkDisabled = false,

  showCommentButton = true,

  likeButtonRef,
  onCommentPress,
  onLikePress,
  onBookmarkPress,
  style,
}) => {
  const formattedDate = createdAt
    ? formatDateDetail(createdAt)
    : '';

  const bookmarkLabel =
    Number(bookmarkCount) > 0
      ? String(bookmarkCount)
      : undefined;

  return (
    <View style={[styles.container, style]}>
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        ellipsizeMode="tail"
        style={styles.date}
      >
        {formattedDate}
      </Text>

      <View style={styles.actions}>
        {showCommentButton && (
          <LabeledButton
            size="M"
            icon={<IcComment />}
            iconColor={colors.fgDeactivate}
            onPress={onCommentPress}
            accessibilityLabel="댓글"
            style={styles.actionButton}
          />
        )}

        <AnimatedLabeledButton
          ref={likeButtonRef}
          size="M"
          isActive={isLiked}
          activeIcon={IcHeartFill}
          inactiveIcon={IcHeartStroke}
          activeColor={colors.fgLike}
          inactiveColor={colors.fgDeactivate}
          animationType={ANIMATION_TYPE.LIKE}
          disabled={likeDisabled}
          onPress={onLikePress}
          accessibilityLabel={
            isLiked ? '좋아요 취소' : '좋아요'
          }
          style={styles.actionButton}
        />

        <AnimatedLabeledButton
          label={bookmarkLabel}
          size="M"
          isActive={isBookmarked}
          activeIcon={IcBookmarkFill}
          inactiveIcon={IcBookmarkStroke}
          activeColor={colors.fgBookmark}
          inactiveColor={colors.fgDeactivate}
          animationType={ANIMATION_TYPE.BOOKMARK}
          disabled={bookmarkDisabled}
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

    paddingVertical: padding.XS,
    paddingHorizontal: padding.L,

    backgroundColor: colors.bgLayerDefault,
  },

  date: {
    ...typo.suitLabelMedium,

    flex: 1,
    minWidth: 0,

    color: colors.fgPlaceholder,
    textAlign: 'justify',
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },

  actionButton: {
    alignSelf: 'center',
  },
});

export default memo(ActionBar);