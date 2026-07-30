import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import IconButton from './IconButton';

import IcX from '../../../../assets/icons/ic_x.svg';
import IcShare from '../../../../assets/icons/ic_share.svg';
import IcKebab from '../../../../assets/icons/ic_kebab.svg';

import { colors } from '../../../styles/color';
import { padding } from '../../../styles/token';

const ICON_SIZE = 18;

const TopIconNavigation = ({
  onPressClose,
  onPressShare,
  onPressMore,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <IconButton
        icon={
          <IcX
            width={ICON_SIZE}
            height={ICON_SIZE}
            color={colors.fgBrand}
          />
        }
        size="M"
        onPress={onPressClose}
        accessibilityLabel="닫기"
      />

      <View style={styles.tail}>
        <IconButton
          icon={
            <IcShare
              width={ICON_SIZE}
              height={ICON_SIZE}
              color={colors.fgBrand}
            />
          }
          size="M"
          onPress={onPressShare}
          accessibilityLabel="공유하기"
        />

        <IconButton
          icon={
            <IcKebab
              width={ICON_SIZE}
              height={ICON_SIZE}
              color={colors.fgBrand}
            />
          }
          size="M"
          onPress={onPressMore}
          accessibilityLabel="더보기"
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
    paddingHorizontal: padding.L,
    paddingBottom: padding.S,
    backgroundColor: colors.bgLayerDefault,
  },

  tail: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});

export default memo(TopIconNavigation);