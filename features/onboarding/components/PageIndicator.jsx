import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../../../shared/styles/color';
import { gap, radius } from '../../../shared/styles/token';

const DOT_SIZE = 6;
const ACTIVE_DOT_WIDTH = 16;

export const PAGE_INDICATOR_HEIGHT = DOT_SIZE;

// 온보딩 페이지 인디케이터. activeIndex(0부터) 위치의 dot만 가로로 늘어난 active 형태로 표시한다
const PageIndicator = ({ total = 3, activeIndex = 0, style }) => (
  <View style={[styles.container, style]}>
    {Array.from({ length: total }, (_, index) => (
      <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: gap.S,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: radius[999],
    backgroundColor: colors.fillNeutralMedium,
  },
  dotActive: {
    width: ACTIVE_DOT_WIDTH,
    backgroundColor: colors.fillNeutralStrong,
  },
});

export default memo(PageIndicator);
