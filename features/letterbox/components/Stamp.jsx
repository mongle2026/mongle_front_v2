import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, FeColorMatrix, Filter, G } from 'react-native-svg';

import { findStamp } from '../../../shared/data/envelopeData';
import { colors } from '../../../shared/styles/color';

// 우표 원본 비율 (편지함 Card 의 44x64 기준)
const STAMP_RATIO = 64 / 44;

// 폭이 width 인 우표의 높이
export const getStampHeight = width => Math.round(width * STAMP_RATIO);

const GRAYSCALE_FILTER_ID = 'stampGrayscale';

/**
 * 우표 code(envelopeData STAMPS[].id, 백엔드 stamp.code)로 우표 이미지를 그린다.
 *
 * @param {string} stampCode 예: 's10'
 * @param {number} [width]
 * @param {boolean} [grayscale] true 면 흑백으로 그린다 (편지함 우표 탭의 받지 않은 우표)
 */
const Stamp = ({ stampCode, width = 44, grayscale = false, style }) => {
  const StampSvg = useMemo(
    () => findStamp(stampCode)?.SvgComponent ?? null,
    [stampCode],
  );

  const size = { width, height: getStampHeight(width) };

  const stampImage = StampSvg && (
    <StampSvg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
  );

  return (
    <View style={[styles.stamp, size, style]}>
      {/* RN 스타일 filter 의 grayscale 은 Android 전용이라 SVG 필터로 채도를 0 으로 만든다 */}
      {stampImage && grayscale ? (
        <Svg width="100%" height="100%">
          <Defs>
            <Filter id={GRAYSCALE_FILTER_ID} filterUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
              <FeColorMatrix type="saturate" values="0" />
            </Filter>
          </Defs>
          <G filter={`url(#${GRAYSCALE_FILTER_ID})`}>{stampImage}</G>
        </Svg>
      ) : (
        stampImage
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  stamp: {
    backgroundColor: colors.bgDisabled,
  },
});

export default memo(Stamp);
