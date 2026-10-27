import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import IcFilledCheck from '../../../assets/icons/ic_filledcheck.svg';

import { colors } from '../../../shared/styles/color';
import { gap, padding, radius } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';

const CHECK_ICON_SIZE = 14;

// 설정 화면용 체크 행. 왼쪽 원형 체크 아이콘 + 텍스트, selected면 채워진 체크 아이콘으로 바뀐다
const CheckContainer = ({ text, selected = false, onPress, style }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="checkbox"
    accessibilityLabel={text}
    accessibilityState={{ checked: selected }}
    style={[styles.container, style]}
  >
    {selected ? (
      <IcFilledCheck
        width={CHECK_ICON_SIZE}
        height={CHECK_ICON_SIZE}
        color={colors.fgNeutralPrimary}
        style={styles.icon}
      />
    ) : (
      <View style={[styles.icon, styles.unchecked]} />
    )}

    <Text style={styles.text}>{text}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: padding.M,
    paddingHorizontal: padding.L,
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.M,
  },
  icon: {
    width: CHECK_ICON_SIZE,
    height: CHECK_ICON_SIZE,
    flexShrink: 0,
  },
  unchecked: {
    borderRadius: radius[999],
    borderWidth: 1,
    borderColor: colors.strokeNeutralSecondary,
  },
  text: {
    ...typo.suitBodyMedium,
    flex: 1,
    color: colors.fgNeutralSecondary,
  },
});

export default memo(CheckContainer);
