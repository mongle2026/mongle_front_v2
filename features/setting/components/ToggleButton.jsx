import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { colors } from '../../../shared/styles/color';
import { radius } from '../../../shared/styles/token';

const TRACK_WIDTH = 48;
const TRACK_HEIGHT = 26;
const THUMB_SIZE = 20;
const THUMB_INSET = (TRACK_HEIGHT - THUMB_SIZE) / 2;

// 설정 화면용 토글 스위치. active면 thumb이 오른쪽, 아니면 왼쪽에 위치한다
const ToggleButton = ({ active = false, disabled = false, onPress, accessibilityLabel, style }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="switch"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{ checked: active, disabled }}
    style={[
      styles.track,
      active && styles.trackActive,
      disabled && styles.trackDisabled,
      style,
    ]}
  >
    <View style={styles.thumb} />
  </Pressable>
);

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    paddingHorizontal: THUMB_INSET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: radius[999],
    backgroundColor: colors.fillNeutralMedium,
  },
  trackActive: {
    justifyContent: 'flex-end',
    backgroundColor: colors.fillPositiveStrong,
  },
  trackDisabled: {
    backgroundColor: colors.fillNeutralDisabled,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius[999],
    backgroundColor: colors.fgNeutralInverted,
  },
});

export default memo(ToggleButton);
