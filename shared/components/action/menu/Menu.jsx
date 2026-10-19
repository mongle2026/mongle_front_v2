import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';

import IcPencil from '../../../../assets/icons/ic_pencil.svg';
import IcTrash from '../../../../assets/icons/ic_trash.svg';

import { colors, shadow } from '../../../styles/color';
import { gap, radius } from '../../../styles/token';

import Item from './Item';

/*
 * 메뉴 열고 닫기: 케밥 버튼이 있는 오른쪽 위 모서리에서 살짝 커지며 펼쳐지고,
 * 닫힐 때는 같은 자리로 작아지며 사라진다. 다른 메뉴(댓글 메뉴 등)도 같은 움직임을 쓰도록 내보낸다.
 */
export const MENU_ENTERING = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ translateY: -6 }, { scale: 0.9 }],
  },
  100: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }],
    easing: Easing.out(Easing.cubic),
  },
}).duration(200);

export const MENU_EXITING = new Keyframe({
  0: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }],
  },
  100: {
    opacity: 0,
    transform: [{ translateY: -4 }, { scale: 0.94 }],
    easing: Easing.in(Easing.quad),
  },
}).duration(130);

// 메뉴는 모두 버튼 아래 오른쪽에 붙어 열린다
export const MENU_TRANSFORM_ORIGIN = 'right top';

const Menu = ({
  onPressEdit,
  onPressDelete,
  editDisabled = false,
  deleteDisabled = false,
  // 삭제만 필요한 화면(편지 상세 등)은 showEdit={false}
  showEdit = true,
  deleteLabel = '삭제',
  deleteAccessibilityLabel = deleteLabel,
  // [{ key, label, onPress }] 를 넘기면 수정/삭제 대신 이 항목들을 보여준다 (정렬 선택 등)
  items,
  style,
}) => {
  if (items) {
    return (
      <Animated.View
        entering={MENU_ENTERING}
        exiting={MENU_EXITING}
        style={[styles.shadowContainer, style]}
      >
        <View style={styles.container}>
          {items.map(item => (
            <Item
              key={item.key}
              label={item.label}
              onPress={item.onPress}
            />
          ))}
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={MENU_ENTERING}
      exiting={MENU_EXITING}
      style={[styles.shadowContainer, style]}
    >
      <View style={styles.container}>
        {showEdit && (
          <Item
            icon={IcPencil}
            label="수정"
            color={colors.fgNeutralSecondary}
            onPress={onPressEdit}
            disabled={editDisabled}
            accessibilityLabel="게시물 수정"
          />
        )}
        <Item
          icon={IcTrash}
          label={deleteLabel}
          color={colors.fgCritical}
          onPress={onPressDelete}
          disabled={deleteDisabled}
          accessibilityLabel={deleteAccessibilityLabel}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  shadowContainer: {
    alignSelf: 'flex-start',
    transformOrigin: MENU_TRANSFORM_ORIGIN,
    borderRadius: radius.M,
    ...shadow.middleDown,
  },
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.XS,
    borderRadius: radius.M,
    backgroundColor: colors.bgBase,
    overflow: 'hidden',
  },
});

export default memo(Menu);