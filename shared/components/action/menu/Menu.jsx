import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import IcPencil from '../../../../assets/icons/ic_pencil.svg';
import IcTrash from '../../../../assets/icons/ic_trash.svg';

import { colors, shadow } from '../../../styles/color';
import { gap, radius } from '../../../styles/token';

import Item from './Item';

const Menu = ({
  onPressEdit,
  onPressDelete,
  editDisabled = false,
  deleteDisabled = false,
  // 삭제만 필요한 화면(편지 상세 등)은 showEdit={false}
  showEdit = true,
  deleteLabel = '삭제',
  deleteAccessibilityLabel = '게시물 삭제',
  // [{ key, label, onPress }] 를 넘기면 수정/삭제 대신 이 항목들을 보여준다 (정렬 선택 등)
  items,
  style,
}) => {
  if (items) {
    return (
      <View style={[styles.shadowContainer, style]}>
        <View style={styles.container}>
          {items.map(item => (
            <Item
              key={item.key}
              label={item.label}
              onPress={item.onPress}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.shadowContainer, style]}>
      <View style={styles.container}>
        {showEdit && (
          <Item
            icon={IcPencil}
            label="수정"
            color={colors.fgNeutralMuted}
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
    </View>
  );
};

const styles = StyleSheet.create({
  shadowContainer: {
    alignSelf: 'flex-start',
    borderRadius: radius.M,
    ...shadow.middleDown,
  },
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.XS,
    borderRadius: radius.M,
    backgroundColor: colors.bgNeutralFaint,
    overflow: 'hidden',
  },
});

export default memo(Menu);