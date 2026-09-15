import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { STAMPS } from '../../../shared/data/envelopeData';
import { colors } from '../../../shared/styles/color';

// 우표 원본 비율 (편지함 Card 의 44x64 기준)
const STAMP_RATIO = 64 / 44;

/**
 * 우표 code(envelopeData STAMPS[].id, 백엔드 stamp.code)로 우표 이미지를 그린다.
 *
 * @param {string} stampCode 예: 's10'
 * @param {number} [width]
 */
const Stamp = ({ stampCode, width = 44, style }) => {
  const StampSvg = useMemo(
    () => STAMPS.find(stamp => stamp.id === stampCode)?.SvgComponent ?? null,
    [stampCode],
  );

  const size = { width, height: Math.round(width * STAMP_RATIO) };

  return (
    <View style={[styles.stamp, size, style]}>
      {StampSvg && <StampSvg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />}
    </View>
  );
};

const styles = StyleSheet.create({
  stamp: {
    backgroundColor: colors.bgDisabled,
  },
});

export default memo(Stamp);
