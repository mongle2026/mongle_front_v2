import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../../styles/color';
import { padding, gap } from '../../styles/token';
import { typo } from '../../styles/typo';

const ButtonText = ({
  text,
  onPress,
  size = 'ButtonText',
  disabled = false,
  style,
  textStyle,
}) => {
  const isSmall = size === 'S';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.container,
        isSmall ? styles.containerS : styles.containerButtonText,
        style,
      ]}
    >
      <Text
        allowFontScaling={false}
        style={[
          styles.text,
          isSmall
            ? typo.suitLabelXXLargeStrong
            : typo.suitLabelXLargeStrong,
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
  },

  containerS: {
    paddingVertical: padding.XS,
    paddingHorizontal: padding.S,
  },

  containerButtonText: {
    paddingVertical: padding.L,
    paddingHorizontal: padding.S,
  },

  text: {
    color: colors.fgDeactivate,
  },
});