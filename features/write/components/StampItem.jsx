import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../../../shared/styles/color';
import { radius } from '../../../shared/styles/token';

// 우표 SVG viewBox(1014 x 1474) 비율. 칸을 이 비율로 잡아야 우표가 잘리거나 여백이 생기지 않는다.
const STAMP_SVG_RATIO = 1014 / 1474;

// 칸 안쪽 여백. 선택 테두리 두께(1.6) + 라운드 모서리에 우표 모서리가 걸리지 않을 만큼.
const STAMP_INSET = 8;

// Svg: react-native-svg-transformer 로 변환된 SVG 컴포넌트 (envelopeData.STAMPS[].SvgComponent)
export default function StampItem({ Svg, isActive = false, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.item, isActive && styles.itemActive, style]}
    >
      {Svg ? (
        <Svg
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
        />
      ) : (
        <View style={styles.placeholder} />
      )}

      {/* border 는 active 일 때만: 레이아웃에 영향 없도록 오버레이로 그린다
          (Pressable 에 borderWidth 를 토글하면 콘텐츠 박스 크기가 변해 SVG 가 사라짐) */}
      {isActive && <View pointerEvents="none" style={styles.activeBorder} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    width: 109,
    aspectRatio: STAMP_SVG_RATIO,
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 0,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    // 선택 시 그려지는 둥근 테두리(radius.XL) 안쪽에 우표가 들어오도록 여백을 둔다
    padding: STAMP_INSET,
  },
  itemActive: {
    opacity: 0.7,
  },
  activeBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.XL,
    borderWidth: 1.6,
    borderColor: colors.strokeNeutralTertiary,
  },
  placeholder: {
    width: '100%',
    height: '100%',
  },
});
