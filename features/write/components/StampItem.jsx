import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../../../shared/styles/color';
import { radius } from '../../../shared/styles/token';

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
          preserveAspectRatio="xMidYMid slice"
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
    height: 166,
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 0,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.XS, // 2
    backgroundColor: colors.strokeNeutralWeak, // 이미지 로딩 전 lightgray 대체
    overflow: 'hidden',
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
    borderRadius: radius.XS, // 2
    borderWidth: 1.6,
    borderColor: colors.strokeNeutralSubtle, // #C4C6CA
  },
  placeholder: {
    width: '100%',
    height: '100%',
  },
});
