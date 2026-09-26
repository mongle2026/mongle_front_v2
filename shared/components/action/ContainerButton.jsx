import React, { memo } from 'react';
import {
  StyleSheet,
  Text,
} from 'react-native';
// BottomSheet 안에서 시트 드래그 제스처에 탭이 먹히지 않도록 gesture-handler 의 Pressable 을 쓴다
import { Pressable } from 'react-native-gesture-handler';

import { colors } from '../../styles/color';
import { padding } from '../../styles/token';
import { typo } from '../../styles/typo';

const ContainerButton = ({
  label,
  onPress,
  style,
  textStyle,
  ...pressableProps
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, style]}
      {...pressableProps}
    >
      <Text style={[typo.suitLabelXLargeStrong, styles.label, textStyle]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: padding.XL,
    backgroundColor: colors.bgLayerDefault,
  },

  label: {
    color: colors.fgNeutralSolid,
  },
});

export default memo(ContainerButton);
