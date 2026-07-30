import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../styles/color';
import { padding } from '../../styles/token';
import { typo } from '../../styles/typo';

const ListHeader = ({
  title,
  style,
  textStyle,
}) => {
  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="header"
    >
      <Text style={[styles.title, textStyle]}>
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: padding.M,
    paddingHorizontal: padding.XL,
    justifyContent: 'center',
    backgroundColor: colors.bgLayerDefault,
  },

  title: {
    ...typo.suitTitleSmallStrong,
    color: colors.fgNeutralMuted,
  },
});

export default memo(ListHeader);