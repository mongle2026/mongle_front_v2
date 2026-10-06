import React, { memo, isValidElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { colors } from '../../styles/color';
import { padding, radius } from '../../styles/token';

// Figma 컴포넌트: action/IconButton (size S / M / L / XL)
const IconButton = ({
  icon: Icon,
  color = colors.fgNeutralPrimary,
  size = 'S',
  onPress,
  disabled = false,
  accessibilityLabel,
  style,
}) => {
  const currentSize = SIZE_STYLES[size] ?? SIZE_STYLES.S;

  // disabled면 전달된 color 대신 fgDisabled로 표시합니다.
  const iconColor = disabled ? colors.fgDisabled : color;

  // Icon은 보통 SVG 컴포넌트 참조를 받아 size/color를 직접 주입합니다.
  // 이미 완성된 엘리먼트(예: 아이콘이 아닌 커스텀 콘텐츠)가 오면 그대로 렌더링합니다.
  // (이 경우 disabled 색상도 적용되지 않습니다)
  const renderedIcon = isValidElement(Icon)
    ? Icon
    : Icon
      ? (
        <Icon
          width={currentSize.iconSize}
          height={currentSize.iconSize}
          color={iconColor}
          fill={iconColor}
        />
      )
      : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={currentSize.hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.container,
        currentSize.container,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.icon,
          {
            width: currentSize.iconSize,
            height: currentSize.iconSize,
          },
        ]}
      >
        {renderedIcon}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  sizeS: {
    padding: padding.XS,
    borderRadius: radius.XS,
  },

  sizeM: {
    padding: padding.S,
    borderRadius: radius.S,
  },

  sizeL: {
    padding: padding.M,
    borderRadius: radius.M,
  },

  sizeXL: {
    padding: padding.M,
    borderRadius: radius.M,
  },

  icon: {
    aspectRatio: 1,
    flexShrink: 0,
  },

  pressed: {
    opacity: 0.6,
  },
});

// 버튼 크기 = iconSize + padding × 2. hitSlop 으로 터치 영역을 44 에 맞춘다
// S 22 / M 30 / L 36 / XL 38
const SIZE_STYLES = {
  S: {
    container: styles.sizeS,
    iconSize: 14,
    hitSlop: 11,
  },

  M: {
    container: styles.sizeM,
    iconSize: 18,
    hitSlop: 7,
  },

  L: {
    container: styles.sizeL,
    iconSize: 20,
    hitSlop: 4,
  },

  XL: {
    container: styles.sizeXL,
    iconSize: 22,
    hitSlop: 3,
  },
};

export default memo(IconButton);