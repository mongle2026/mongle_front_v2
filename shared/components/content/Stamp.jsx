import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, FeColorMatrix, FeComposite, FeGaussianBlur, Filter, G } from 'react-native-svg';

import { findStamp } from '../../data/envelopeData';

// 우표 원본 비율 (편지함 Card 의 44x64 기준)
const STAMP_RATIO = 64 / 44;

// 폭이 width 인 우표의 높이
export const getStampHeight = width => Math.round(width * STAMP_RATIO);

const GRAYSCALE_FILTER_ID = 'stampGrayscale';

/*
 * 받지 않은 우표: 그림은 알아볼 수 없고, 우표 모양(톱니 가장자리)의 회색 자리만 보이게 한다.
 * 흑백 밝기 L 을 UNCOLLECTED_BASE ~ UNCOLLECTED_BASE + UNCOLLECTED_CONTRAST 범위로 좁혀 명암 차이를 거의 없애고,
 * 블러로 남은 윤곽까지 흐린다.
 * 필터는 linearRGB 로 계산되어 화면에서는 값보다 밝게 보인다 (0.68 ≈ 화면 밝기 0.85, 배경보다 한 단계 진한 회색)
 */
const UNCOLLECTED_CONTRAST = 0.04;
const UNCOLLECTED_BASE = 0.68;
const UNCOLLECTED_BLUR = 3;

const luminanceRow = [0.2126, 0.7152, 0.0722]
  .map(weight => weight * UNCOLLECTED_CONTRAST)
  .join(' ');
const UNCOLLECTED_COLOR_MATRIX = [
  `${luminanceRow} 0 ${UNCOLLECTED_BASE}`,
  `${luminanceRow} 0 ${UNCOLLECTED_BASE}`,
  `${luminanceRow} 0 ${UNCOLLECTED_BASE}`,
  '0 0 0 1 0',
].join(' ');

/**
 * 이미 찾은 우표 SVG 를 그린다. SVG 가 없으면 빈(투명) 자리만 그린다.
 * 크기 / 위치는 style 로 받는다.
 *
 * @param {React.ComponentType} [StampSvg] envelopeData STAMPS[].SvgComponent
 * @param {boolean} [grayscale] true 면 그림이 거의 보이지 않는 밝은 회색으로 그린다 (편지함 우표 탭의 받지 않은 우표)
 * @param {object} style 우표 크기 / 위치
 * @param {'none'} [pointerEvents]
 */
export const StampImage = memo(({ StampSvg, grayscale = false, style, pointerEvents }) => {
  const stampImage = StampSvg && (
    <StampSvg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
  );

  return (
    <View style={[styles.stamp, style]} pointerEvents={pointerEvents}>
      {/* RN 스타일 filter 의 grayscale · blur 는 Android 전용이라 SVG 필터로 처리한다 */}
      {stampImage && grayscale ? (
        <Svg width="100%" height="100%">
          <Defs>
            <Filter id={GRAYSCALE_FILTER_ID} filterUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
              <FeColorMatrix type="matrix" values={UNCOLLECTED_COLOR_MATRIX} />
              <FeGaussianBlur stdDeviation={UNCOLLECTED_BLUR} result="blurred" />
              {/* 블러가 우표 밖으로 번지지 않게 원래 우표 모양(톱니 가장자리)으로 잘라 낸다 */}
              <FeComposite in="blurred" in2="SourceGraphic" operator="in" />
            </Filter>
          </Defs>
          <G filter={`url(#${GRAYSCALE_FILTER_ID})`}>{stampImage}</G>
        </Svg>
      ) : (
        stampImage
      )}
    </View>
  );
});

/**
 * 우표 code(envelopeData STAMPS[].id, 백엔드 stamp.code)로 우표 SVG 를 찾아 StampImage 로 그린다.
 *
 * @param {string} stampCode 예: 's10'
 * @param {number} [width] 높이는 원본 비율로 계산한다
 * @param {boolean} [grayscale]
 */
const Stamp = ({ stampCode, width = 44, grayscale = false, style }) => {
  const StampSvg = useMemo(
    () => findStamp(stampCode)?.SvgComponent ?? null,
    [stampCode],
  );

  return (
    <StampImage
      StampSvg={StampSvg}
      grayscale={grayscale}
      style={[{ width, height: getStampHeight(width) }, style]}
    />
  );
};

const styles = StyleSheet.create({
  stamp: {
    backgroundColor: 'transparent',
  },
});

export default memo(Stamp);
