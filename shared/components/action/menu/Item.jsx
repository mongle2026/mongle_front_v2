import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../styles/color';
import { gap, padding } from '../../../styles/token';
import { typo } from '../../../styles/typo';

const ICON_SIZE = 16;

const Item = ({
  icon: Icon,
  label,
  color = colors.fgNeutralSecondary,
  onPress,
  disabled = false,
  iconProps,
  style,
  textStyle,
  accessibilityLabel = label,
}) => {
  // disabled 면 넘겨받은 color 대신 아이콘·글자 모두 fgDisabled
  const contentColor = disabled ? colors.fgDisabled : color;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {Icon && (
        <View style={styles.iconContainer}>
          <Icon
            width={ICON_SIZE}
            height={ICON_SIZE}
            color={contentColor}
            fill={contentColor}
            {...iconProps}
          />
        </View>
      )}
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          { color: contentColor },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    // 메뉴 폭만큼 채워서 항목마다 배경이 끝까지 칠해지고, 내용은 가운데에 온다
    alignSelf: 'stretch',
    paddingVertical: padding.XL,
    paddingHorizontal: padding.XXL,
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap.M,
    backgroundColor: colors.fillSurface,
  },
  pressed: {
    backgroundColor: colors.fillSurfacePress,
  },
  disabled: {
    backgroundColor: colors.fillSurface,
  },
  iconContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    ...typo.suitLabelXLargeStrong,
    flexShrink: 1,
  },
});

export default memo(Item);