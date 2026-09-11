import React, { memo } from 'react';
import { View } from 'react-native';

/* 마지막 행의 빈 칸을 채워 그리드 정렬을 유지한다 */
const GridSpacers = ({ count, style }) => (
  <>
    {Array.from({ length: Math.max(0, count) }).map((_, index) => (
      <View key={`spacer-${index}`} style={style} />
    ))}
  </>
);

export default memo(GridSpacers);
