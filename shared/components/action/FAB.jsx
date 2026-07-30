import React, {
  memo,
  useCallback,
  useState,
} from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { colors, shadow } from '../../styles/color';
import { gap } from '../../styles/token';

const FAB_SIZE = 44;

const FABButton = memo(
  ({
    icon,
    tone = 'dark',
    onPress,
    accessibilityLabel,
    expanded,
  }) => {
    const accessibilityState =
      typeof expanded === 'boolean'
        ? { expanded }
        : undefined;

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={accessibilityState}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          tone === 'light'
            ? styles.lightButton
            : styles.darkButton,
          pressed && styles.pressed,
        ]}
      >
        {icon}
      </Pressable>
    );
  },
);

FABButton.displayName = 'FABButton';

const FAB = ({
  actions = [],
  plusIcon,
  closeIcon,

  // 외부에서 상태를 제어하고 싶을 때 사용
  open,

  // 외부 open을 전달하지 않을 때의 최초 상태
  defaultOpen = false,

  onOpenChange,
  closeOnActionPress = true,
  style,
}) => {
  const [internalOpen, setInternalOpen] =
    useState(defaultOpen);

  const isControlled = typeof open === 'boolean';
  const isOpen = isControlled ? open : internalOpen;

  const changeOpen = useCallback(
    nextOpen => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  const handleToggle = useCallback(() => {
    changeOpen(!isOpen);
  }, [changeOpen, isOpen]);

  const handleActionPress = useCallback(
    action => {
      if (closeOnActionPress) {
        changeOpen(false);
      }

      action.onPress?.();
    },
    [changeOpen, closeOnActionPress],
  );

  return (
    <View style={[styles.container, style]}>
      {isOpen &&
        actions.map(action => (
          <FABButton
            key={action.id}
            icon={action.icon}
            accessibilityLabel={
              action.accessibilityLabel
            }
            onPress={() => handleActionPress(action)}
          />
        ))}

      <FABButton
        icon={isOpen ? closeIcon : plusIcon}
        tone={isOpen ? 'light' : 'dark'}
        accessibilityLabel={
          isOpen ? '작성 메뉴 닫기' : '작성 메뉴 열기'
        }
        expanded={isOpen}
        onPress={handleToggle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: gap.M,
  },

  button: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    justifyContent: 'center',
    alignItems: 'center',

    // 44 × 44 크기의 정확한 원
    borderRadius: FAB_SIZE / 2,

    ...shadow.middleDown,
  },

  darkButton: {
    backgroundColor: colors.bgBrandSolid,
  },

  lightButton: {
    backgroundColor: colors.bgLayerDefault,
  },

  pressed: {
    opacity: 0.8,
  },
});

export default memo(FAB);