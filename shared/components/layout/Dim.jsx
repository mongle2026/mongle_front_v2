import React, { memo, } from 'react';
import {
  Pressable,
  StyleSheet,
} from 'react-native';

import {
  colors,
} from '../../styles/color';

const Dim = ({
  visible = true,
  onPress,
  accessibilityLabel = '배경 닫기',
  style,
  testID,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <Pressable
      testID={testID}
      accessibilityRole={
        onPress
          ? 'button'
          : undefined
      }
      accessibilityLabel={
        onPress
          ? accessibilityLabel
          : undefined
      }
      onPress={onPress}
      style={[
        styles.container,
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor:
      colors.bgOverlayMuted,
  },
});

export default memo(Dim);