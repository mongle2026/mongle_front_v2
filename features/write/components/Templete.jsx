import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../shared/styles/color';
import { gap, padding, radius } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';

// 미리보기 슬롯 높이(고정). 너비는 aspect-ratio 로 결정된다.
const PREVIEW_HEIGHT = 88;
const STAMP_ASPECT_RATIO = 59 / 88;

// PatternSvg / StampSvg: react-native-svg-transformer 로 변환된 SVG 컴포넌트
//  - PatternSvg: envelopeData.PATTERNS[].thumbnail
//  - StampSvg  : envelopeData.STAMPS[].SvgComponent
export default function Templete({
  label,
  PatternSvg,
  StampSvg,
  isActive = false,
  onPress,
  style,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, isActive && styles.containerActive, style]}
    >
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>

      <View style={styles.previewRow}>
        {/* pattern 정보 넣을 곳 (aspect-ratio 1/1) */}
        <View style={[styles.slot, styles.patternSlot]}>
          {PatternSvg && (
            <PatternSvg
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid slice"
            />
          )}
        </View>

        {/* stamp 정보 넣을 곳 (aspect-ratio 59/88) */}
        <View style={[styles.slot, styles.stampSlot]}>
          {StampSvg && (
            <StampSvg
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid slice"
            />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start', 
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: padding.S,
    paddingVertical: padding.M, 
    paddingHorizontal: padding.L, 
    borderRadius: radius.XS, 
    borderWidth: 1.6,
    borderColor: 'transparent', 
    backgroundColor: colors.bgLayerDefault, 
  },
  containerActive: {
    borderColor: colors.strokeNeutralSubtle, 
    backgroundColor: colors.bgLayerDefaultPressed, 
  },
  label: {
    alignSelf: 'stretch',
    color: colors.fgNeutralSolid, 
    ...typo.suitLabelLarge, 
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.S, 
  },
  slot: {
    height: PREVIEW_HEIGHT,
    borderRadius: radius.XS, 
    backgroundColor: colors.strokeNeutralWeak, // 이미지 로딩 전 lightgray 대체
    overflow: 'hidden',
  },
  patternSlot: {
    aspectRatio: 1, 
  },
  stampSlot: {
    aspectRatio: STAMP_ASPECT_RATIO, 
  },
});
