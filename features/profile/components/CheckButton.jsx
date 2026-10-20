import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import IcFilledCheck from '../../../assets/icons/ic_filledcheck.svg';

import { colors } from '../../../shared/styles/color';
import { radius } from '../../../shared/styles/token';

const CHECK_BUTTON_SIZE = 24;
const CHECK_ICON_SIZE = 24;

// 프로필 노래 카드 선택용 원형 체크 버튼. selected면 테두리가 진해지고 채워진 체크 아이콘이 올라간다
const CheckButton = ({ selected = false, onPress, accessibilityLabel, style }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="checkbox"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{ checked: selected }}
    style={[styles.container, selected && styles.selected, style]}
  >
    {selected && (
      <IcFilledCheck
        width={CHECK_ICON_SIZE}
        height={CHECK_ICON_SIZE}
        color={colors.fgNeutralPrimary}
      />
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    width: CHECK_BUTTON_SIZE,
    height: CHECK_BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius[999],
    borderWidth: 1.5,
    borderColor: colors.strokeNeutralSecondary,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  selected: {
    borderColor: colors.strokeNeutralPrimary,
  },
});

export default memo(CheckButton);
