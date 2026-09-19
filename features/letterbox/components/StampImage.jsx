import { View } from 'react-native';

/**
 * 편지 / 카드의 우표 자리.
 * 우표 SVG가 있으면 SVG, 없으면 빈 자리를 그린다.
 *
 * @param {React.ComponentType} [StampSvg] envelopeData STAMPS[].SvgComponent
 * @param {object} style 우표 크기 / 위치
 * @param {'none'} [pointerEvents] SVG 를 감싸는 View 에 적용
 */
const StampImage = ({ StampSvg, style, pointerEvents }) => {
  if (!StampSvg) {
    return <View style={style} />;
  }

  return (
    <View style={style} pointerEvents={pointerEvents}>
      <StampSvg
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
      />
    </View>
  );
};

export default StampImage;
