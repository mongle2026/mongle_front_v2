import React, { memo, useCallback, useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import usePressAnimation from '../../../hooks/usePressAnimation';
import { colors } from '../../../styles/color';
import { gap, padding } from '../../../styles/token';
import { typo } from '../../../styles/typo';

const ICON_SIZE = 22;

// 탭을 바꾸면 아이콘 · 글자 색이 순간 교체되지 않고 천천히 스며들듯 바뀐다 (크기 변화 없이 색만)
const ACTIVE_TIMING = { duration: 260, easing: Easing.inOut(Easing.cubic) };

const playSelectionHaptic = () => {
  void Haptics.selectionAsync().catch(() => {
    /* 햅틱을 지원하지 않는 환경에서도 탭 이동은 그대로 동작한다 */
  });
};

const Item = ({
  label,
  icon: Icon,
  isActive = false,
  onPress,
  accessibilityLabel = label,
  style,
}) => {
  const activeProgress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    activeProgress.value = withTiming(isActive ? 1 : 0, ACTIVE_TIMING);
  }, [isActive, activeProgress]);

  // 다른 탭으로 옮길 때만 햅틱 (이미 선택된 탭을 다시 누르면 맨 위로 가기라서 조용히)
  const handlePress = useCallback(
    event => {
      if (!isActive) playSelectionHaptic();
      onPress?.(event);
    },
    [isActive, onPress],
  );

  const { animatedStyle, pressHandlers } = usePressAnimation({ onPress: handlePress });

  // SVG 아이콘 색은 애니메이션하기 어려워서, 비활성 · 활성 색 아이콘을 겹쳐 두고 활성 쪽 투명도만 바꾼다
  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: activeProgress.value,
  }));

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      activeProgress.value,
      [0, 1],
      [colors.fgDisabled, colors.fgNeutralSecondary],
    ),
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Pressable
        accessibilityRole="tab"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected: isActive }}
        {...pressHandlers}
        style={styles.container}
      >
        <View style={styles.iconContainer}>
          <Icon
            width={ICON_SIZE}
            height={ICON_SIZE}
            color={colors.fgDisabled}
          />

          <Animated.View style={[StyleSheet.absoluteFill, activeIconStyle]}>
            <Icon
              width={ICON_SIZE}
              height={ICON_SIZE}
              color={colors.fgNeutralSecondary}
            />
          </Animated.View>
        </View>

        <Animated.Text
          numberOfLines={1}
          style={[
            styles.label,
            labelAnimatedStyle,
          ]}
        >
          {label}
        </Animated.Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: padding.M,
    paddingBottom: padding.XXL,
    flexDirection: 'column',
    alignItems: 'center',
    gap: gap.S,
    backgroundColor: colors.bgSurface,
  },

  iconContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },

  label: {
    alignSelf: 'stretch',
    textAlign: 'center',
    ...typo.suitLabelMedium,
  },
});

export default memo(Item);