import React, { memo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

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
