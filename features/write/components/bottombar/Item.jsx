import React, { memo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import { colors } from '../../../../shared/styles/color';
import { typo } from '../../../../shared/styles/typo';
import {
  padding,
  radius,
} from '../../../../shared/styles/token';
import { FONT } from '../../../../shared/styles/font';

const Item = ({
  text,
  font = FONT.SUIT,
  selected = false,
  onPress,
}) => {
  const textTypo =
    font === FONT.KYOBO
      ? typo.kyoboLabelXLarge
      : typo.suitLabelXLarge;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={styles.container}
    >
      <Text
        allowFontScaling={false}
        style={[
          styles.text,
          textTypo,
        ]}
      >
        {text}
      </Text>
    </Pressable>
  );
};

export default memo(Item);

const styles = StyleSheet.create({
  container: {
    height: 44,

    paddingVertical: padding.XS,
    paddingHorizontal: padding.M,

    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',

    borderRadius: radius.M,
  },
  text: {
    color: colors.fgNeutralMuted,
  },
});