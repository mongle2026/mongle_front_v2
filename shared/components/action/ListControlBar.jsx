import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import IcChevron from '../../../assets/icons/ic_chevron.svg';

import { colors } from '../../styles/color';
import { gap, padding } from '../../styles/token';
import { typo } from '../../styles/typo';

const ListControlBar = ({
  text = '',
  onPress,

  style,
  textStyle,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={styles.button}
      >
        <Text style={[styles.text, textStyle]}>
          {text}
        </Text>

        <IcChevron
          width={14}
          height={14}
          color={colors.fgNeutralSubtle}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',

    paddingHorizontal: padding.L,

    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',

    backgroundColor: colors.bgLayerBasement,
  },

  button: {
    padding: padding.M,

    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.S,
  },

  text: {
    ...typo.suitLabelLargeStrong,

    color: colors.fgNeutralSubtle,
  },
});

export default memo(ListControlBar);
