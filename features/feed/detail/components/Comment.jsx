import React, { memo, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import IcComment from '../../../../assets/icons/ic_comment.svg';
import IcKebab from '../../../../assets/icons/ic_kebab.svg';

import IconButton from '../../../../shared/components/action/IconButton';
import LabeledButton from '../../../../shared/components/action/LabeledButton';
import ProfileImg from '../../../../shared/components/atomic/ProfileImg';
import SuitSafeText from '../../../../shared/components/atomic/SuitSafeText';

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
  const containerRef = useRef(null);
  const menuButtonRef = useRef(null);

  const normalizedUserCode = String(userCode ?? '').replace(/^@+/, '');

  // 키보드가 올라온 뒤 이 댓글이 가려졌는지 다시 재야 해서
  // 좌표 대신 View ref를 넘긴다.
  const handlePressReply = () => {
    onPressReply?.(containerRef);
  };

  // 키보드가 내려가면서 레이아웃이 바뀌면 위치를 다시 재야 해서
  // 좌표 대신 재는 함수를 넘긴다. 언제 잴지는 useCommentMenu가 정한다.
  const measureMenuButton = callback => {
    menuButtonRef.current?.measureInWindow(
      (x, y, width, height) => {
        callback({
          x,
          y,
          width,
          height,
        });
      },
    );
  };

  const handlePressMenu = () => {
    onPressMenu?.(measureMenuButton);
  };

  return (
    <View
      ref={containerRef}
      collapsable={false}
      style={[
        styles.container,
        isReply && styles.replyContainer,
        style,
      ]}
    >
      <View style={styles.contentWrapper}>
        {/* 댓글 본문을 누르면 답글 달기로 이어진다.
            답댓글에는 '답글 달기' 버튼이 없어서, 터치가 유일한 진입점이다. */}
        <Pressable
          onPress={handlePressReply}
          accessibilityRole="button"
          accessibilityLabel="답글 달기"
          style={({ pressed }) => [
            styles.content,
            (isMenuOpen || pressed) && styles.activeContent,
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

              {/* 케밥 자리만 잡아 둔다. 실제 버튼은 Pressable 밖에 겹쳐 그린다. */}
              {showMenu && <View style={styles.menuPlaceholder} />}
            </View>

            <SuitSafeText style={styles.comment}>
              {comment}
            </SuitSafeText>

            {!isReply && (
              <LabeledButton
                label="답글 달기"
                icon={IcComment}
                size="S"
                color={colors.fgNeutralWeak}
                iconColor={colors.fgNeutralWeak}
                onPress={handlePressReply}
                accessibilityLabel="답글 달기"
              />
            )}
          </View>
        </Pressable>

        {/* 케밥이 본문 Pressable 안에 있으면 터치를 본문이 가져가서
            케밥이 눌리지 않는다. 그래서 밖으로 빼서 헤더 오른쪽 위에 겹친다. */}
        {showMenu && (
          <View
            ref={menuButtonRef}
            collapsable={false}
            style={styles.menuButton}
          >
            <IconButton
              size="S"
              icon={IcKebab}
              color={colors.fgNeutralWeak}
              onPress={handlePressMenu}
              accessibilityLabel="댓글 메뉴"
            />
          </View>
        )}
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
    paddingRight: padding.M,
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

  // 케밥 메뉴가 열렸을 때와 손가락이 닿아 있을 때 같은 색으로 강조한다
  activeContent: {
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
    color: colors.fgNeutralWeak,
  },

  contentWrapper: {
    width: '100%',
  },

  // IconButton S 크기 (아이콘 14 + padding XS * 2)
  menuPlaceholder: {
    width: 14 + padding.XS * 2,
    height: 14 + padding.XS * 2,
    marginLeft: 'auto',
  },

  // content의 padding 안쪽, 헤더 오른쪽 끝(menuPlaceholder 자리)에 맞춘다
  menuButton: {
    position: 'absolute',
    top: padding.M,
    right: padding.M,
  },

  comment: {
    ...typo.suitBodyXLarge,
    width: '100%',
    alignSelf: 'stretch',
    color: colors.fgNeutralMuted,
  },
});

export default memo(Comment);
