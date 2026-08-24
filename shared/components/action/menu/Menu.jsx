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
  style,
}) => {
  return (
    <View style={[styles.shadowContainer, style]}>
      <View style={styles.container}>
        <Item
          icon={IcPencil}
          label="수정"
          color={colors.fgNeutralMuted}
          onPress={onPressEdit}
          disabled={editDisabled}
          accessibilityLabel="게시물 수정"
        />
        <Item
          icon={IcTrash}
          label="삭제"
          color={colors.fgCritical}
          onPress={onPressDelete}
          disabled={deleteDisabled}
          accessibilityLabel="게시물 삭제"
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