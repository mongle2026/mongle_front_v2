import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { colors } from '../../../../shared/styles/color';
import { radius } from '../../../../shared/styles/token';
import { typo } from '../../../../shared/styles/typo';

export const CALENDAR_ITEM_SIZE = 48;

const Item = ({
  children,
  state = 'default',
  onPress,
}) => {
  const isDisabled = state === 'disabled';
  const isCurrent = state === 'current';

  /**
   * 요일 헤더 / 선택 불가 날짜처럼 누를 일이 없는 칸은 View로 그립니다.
   * Pressable(gesture-handler)은 칸마다 native 제스처 핸들러를 만들어
   * 달력 한 달(최대 42칸)을 마운트하는 비용이 커지기 때문입니다.
   */
  const Container =
    onPress && !isDisabled
      ? Pressable
      : View;

  return (
    <Container
      style={styles.container}
      onPress={
        Container === Pressable
          ? onPress
          : undefined
      }
    >
      <View
        style={[
          styles.content,
          isCurrent && styles.currentContent,
        ]}
      >
        <Text
          style={[
            styles.label,
            isDisabled && styles.disabledLabel,
            isCurrent && styles.currentLabel,
          ]}
        >
          {children}
        </Text>
      </View>
    </Container>
  );
};

export default Item;

const styles = StyleSheet.create({
  container: {
    width: CALENDAR_ITEM_SIZE,
    height: CALENDAR_ITEM_SIZE,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.M,
  },

  content: {
    flex: 1,
    alignSelf: 'stretch',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },

  currentContent: {
    width: 38,
    height: 38,
    flex: 0,
    alignSelf: 'center',
    borderRadius: radius.M,
    backgroundColor: colors.bgInfoWeak,
  },

  label: {
    ...typo.suitLabelLargeStrong,
    color: colors.fgNeutralMuted,
    textAlign: 'center',
  },

  disabledLabel: {
    color: colors.fgDisabled,
  },

  currentLabel: {
    color: colors.fgInformativeContrast,
  },
});