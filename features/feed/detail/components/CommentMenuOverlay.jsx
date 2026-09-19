import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import IcTrash from '../../../../assets/icons/ic_trash.svg';

import Item from '../../../../shared/components/action/menu/Item';

import { colors, shadow } from '../../../../shared/styles/color';
import { radius } from '../../../../shared/styles/token';

/**
 * 댓글 케밥 메뉴 (삭제).
 * 위치 계산과 열고 닫기는 useCommentMenu가 맡고, 여기서는 그리기만 합니다.
 *
 * ref: useCommentMenu의 commentMenuOverlayRef.
 * 이 View의 화면 위치를 재서 메뉴 top을 계산하므로
 * collapsable={false}를 꼭 유지해야 합니다 (Android에서 View가 합쳐지면 측정이 안 됨).
 */
const CommentMenuOverlay = ({
  ref,
  menu,
  onClose,
  onMenuLayout,
  onPressDelete,
  deleteDisabled,
}) => (
  <View
    ref={ref}
    collapsable={false}
    style={styles.commentMenuOverlay}
  >
    <Pressable
      style={StyleSheet.absoluteFill}
      onPress={onClose}
    />

    <View
      onLayout={onMenuLayout}
      style={[
        styles.commentMenu,
        {
          top: menu.top,
          // 위치를 재기 전에는 엉뚱한 곳에 잠깐 보이지 않도록 숨겨 둡니다.
          opacity: menu.isMeasured ? 1 : 0,
        },
      ]}
    >
      <Item
        icon={IcTrash}
        label="삭제"
        color={colors.fgCritical}
        onPress={onPressDelete}
        disabled={deleteDisabled}
        accessibilityLabel="댓글 삭제"
        style={styles.commentDeleteItem}
      />
    </View>
  </View>
);

export default CommentMenuOverlay;

const styles = StyleSheet.create({
  commentMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 100,
    elevation: 100,
  },

  commentMenu: {
    position: 'absolute',
    right: 8,
    zIndex: 1,
    elevation: 101,
  },

  commentDeleteItem: {
    borderRadius: radius.M,
    ...shadow.middleDown,
  },
});
