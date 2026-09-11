import { Pressable, StyleSheet } from 'react-native';

import { colors } from '../../../shared/styles/color';

// color: envelopeData.PATTERNS[].colors[].color (hex 문자열)
export default function ColorItem({ color, isActive = false, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.item,
        color && { backgroundColor: color },
        isActive && styles.itemActive,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  item: {
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: 1,
    flexShrink: 0,
    borderRadius: 109,
    borderWidth: 1,
    borderColor: colors.strokeNeutralWeak, // 밝은 컬러도 경계가 보이도록
    backgroundColor: colors.strokeNeutralWeak, 
    overflow: 'hidden',
  },
  itemActive: {
    borderWidth: 1.6,
    borderColor: colors.strokeNeutralSubtle, 
    opacity: 0.7,
  },
});
