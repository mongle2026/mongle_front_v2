import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../../shared/styles/color';
import { radius } from '../../../../shared/styles/token';
import { typo } from '../../../../shared/styles/typo';

const Item = ({
  children,
  state = 'default',
  onPress,
}) => {
  const isDisabled = state === 'disabled';
  const isCurrent = state === 'current';

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      disabled={isDisabled}
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
    </Pressable>
  );
};

export default Item;

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
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