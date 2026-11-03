import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import IcFilledCheck from '../../../assets/icons/ic_filledcheck.svg';

import { colors } from '../../styles/color';
import { gap, padding, radius } from '../../styles/token';
import { typo } from '../../styles/typo';

const CHECK_ICON_SIZE = 16;

// 체크 아이콘을 텍스트 앞(head)에 둘지 뒤(tail)에 둘지. 둘 중 하나만 쓴다
export const CHECK_POSITION = Object.freeze({
  HEAD: 'head',
  TAIL: 'tail',
});

const CheckIcon = ({ selected }) =>
  selected ? (
    <IcFilledCheck
      width={CHECK_ICON_SIZE}
      height={CHECK_ICON_SIZE}
      color={colors.fgNeutralPrimary}
      style={styles.icon}
    />
  ) : (
    <View style={[styles.icon, styles.unchecked]} />
  );

// 체크 행. 원형 체크 아이콘 + 텍스트, selected면 채워진 체크 아이콘과 진한 텍스트로 바뀐다
const CheckboxRow = ({
  text,
  selected = false,
  checkPosition = CHECK_POSITION.HEAD,
  onPress,
  style,
}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="checkbox"
    accessibilityLabel={text}
    accessibilityState={{ checked: selected }}
    style={[styles.container, style]}
  >
    {checkPosition === CHECK_POSITION.HEAD && <CheckIcon selected={selected} />}

    <Text style={[styles.text, selected && styles.textSelected]}>{text}</Text>

    {checkPosition === CHECK_POSITION.TAIL && <CheckIcon selected={selected} />}
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: padding.L,
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
    ...typo.suitBodyLarge,
    flex: 1,
    color: colors.fgNeutralSecondary,
  },
  textSelected: {
    color: colors.fgNeutralPrimary,
  },
});

export default memo(CheckboxRow);
