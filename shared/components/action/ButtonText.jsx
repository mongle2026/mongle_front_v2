import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { colors } from '../../styles/color';
import { padding, gap } from '../../styles/token';
import { typo } from '../../styles/typo';

const ButtonText = ({
  text,
  onPress,
  disabled = false,
  style,
  textStyle,
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.container,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          typo.suitLabelXLargeStrong,
          textStyle,
        ]}
      >
        {text}
      </Text>
    </Pressable>
  );
};

export default ButtonText;

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',

    justifyContent: 'center',
    alignItems: 'center',
    gap: gap.M,
    padding: padding.S,
  },

  text: {
    color: colors.fgNeutralQuaternary,
  },
});