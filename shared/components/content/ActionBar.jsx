import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import IcBookmarkFill from '../../../assets/icons/ic_bookmark_fill.svg';
import IcBookmarkStroke from '../../../assets/icons/ic_bookmark_stroke.svg';
import IcComment from '../../../assets/icons/ic_comment.svg';
import IcHeartFill from '../../../assets/icons/ic_heart_fill.svg';
import IcHeartStroke from '../../../assets/icons/ic_heart_stroke.svg';

import AnimatedLabeledButton, {
  ANIMATION_TYPE,
} from '../action/AnimatedLabeledButton';
import LabeledButton from '../action/LabeledButton';

import { colors } from '../../styles/color';
import { padding } from '../../styles/token';
import { typo } from '../../styles/typo';
import { formatDate, formatDateDetail } from '../../utils/dateUtils';

const ActionBar = ({
  createdAt,
  showTime = true,
  // 날짜 앞뒤에 붙는 말. 예) '>' + 날짜 + '도착'
  datePrefix,
  dateSuffix,
  isLiked = false,
  isBookmarked = false,
  bookmarkCount,

  likeDisabled = false,
  bookmarkDisabled = false,

  showCommentButton = true,
  showLikeButton = true,
  showBookmarkButton = true,

  likeButtonRef,
  onCommentPress,
  onLikePress,
  onBookmarkPress,
  style,
}) => {
  const formatCreatedAt = showTime
    ? formatDateDetail
    : formatDate;

  const formattedDate = createdAt
    ? [datePrefix, formatCreatedAt(createdAt), dateSuffix]
      .filter(Boolean)
      .join(' ')
    : '';

  const bookmarkLabel =
    Number(bookmarkCount) > 0
      ? String(bookmarkCount)
      : undefined;

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
        {showCommentButton && (
          <LabeledButton
            size="M"
            icon={IcComment}
            iconColor={colors.fgNeutralWeak}
            onPress={onCommentPress}
            accessibilityLabel="댓글"
            style={styles.actionButton}
          />
        )}

        {showLikeButton && (
          <AnimatedLabeledButton
            ref={likeButtonRef}
            size="M"
            isActive={isLiked}
            activeIcon={IcHeartFill}
            inactiveIcon={IcHeartStroke}
            activeColor={colors.fgLike}
            inactiveColor={colors.fgNeutralWeak}
            animationType={ANIMATION_TYPE.LIKE}
            disabled={likeDisabled}
            onPress={onLikePress}
            accessibilityLabel={
              isLiked ? '좋아요 취소' : '좋아요'
            }
            style={styles.actionButton}
          />
        )}

        {showBookmarkButton && (
          <AnimatedLabeledButton
            label={bookmarkLabel}
            size="M"
            isActive={isBookmarked}
            activeIcon={IcBookmarkFill}
            inactiveIcon={IcBookmarkStroke}
            activeColor={colors.fgBookmark}
            inactiveColor={colors.fgNeutralWeak}
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
        )}
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