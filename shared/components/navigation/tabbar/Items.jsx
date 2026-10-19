import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '../../../styles/color';
import { gap, padding } from '../../../styles/token';
import { typo } from '../../../styles/typo';

const PRESSED_SCALE = 0.96;

/*
 * activePosition(TabBar 의 밑줄 위치, 탭 인덱스를 소수로 움직이는 값)이 있으면
 * 밑줄이 다가오는 만큼 글자색이 진해진다. 굵기는 애니메이션할 수 없어 isActive 로 바로 바꾼다.
 */
const Items = ({
  label,
  index = 0,
  isActive = false,
  activePosition = null,
  onPress,
  accessibilityLabel = label,
  style,
}) => {
  const pressScale = useSharedValue(1);

  const labelAnimatedStyle = useAnimatedStyle(() => {
    const scale = { transform: [{ scale: pressScale.value }] };

    if (!activePosition) return scale;

    const activeAmount = interpolate(
      Math.abs(activePosition.value - index),
      [0, 1],
      [1, 0],
      'clamp',
    );

    return {
      ...scale,
      color: interpolateColor(
        activeAmount,
        [0, 1],
        [colors.fgNeutralQuaternary, colors.fgNeutralPrimary],
      ),
    };
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        pressScale.value = withTiming(PRESSED_SCALE, { duration: 90 });
      }}
      onPressOut={() => {
        pressScale.value = withTiming(1, { duration: 160 });
      }}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: isActive }}
      style={[
        styles.container,
        style,
      ]}
    >
      <View style={styles.inner}>
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.label,
            isActive ? styles.labelActive : styles.labelInactive,
            labelAnimatedStyle,
          ]}
        >
          {label}
        </Animated.Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: padding.L,
    paddingHorizontal: padding.M,
    justifyContent: 'center',
    alignItems: 'center',
    // 활성 탭의 검은 밑줄은 TabBar 가 이 줄 위에 겹쳐 그리고, 탭을 바꿀 때 옆으로 움직인다
    borderBottomWidth: 1,
    borderBottomColor: colors.strokeNeutralTertiary,
  },

  inner: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap.M,
  },

  label: {
    textAlign: 'center',
  },

  labelInactive: {
    ...typo.suitLabelLarge,
    color: colors.fgNeutralQuaternary,
  },

  labelActive: {
    ...typo.suitLabelLargeStrong,
    color: colors.fgNeutralPrimary,
  },
});

export default memo(Items);
