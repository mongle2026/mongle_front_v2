import React, { memo, useCallback, useState, } from 'react';
import { Pressable, StyleSheet, View, } from 'react-native';

import FeedIcon from '../../../assets/icons/ic_feed.svg';
import LetterIcon from '../../../assets/icons/ic_letter.svg';
import PlusIcon from '../../../assets/icons/ic_plus.svg';
import CloseIcon from '../../../assets/icons/ic_x.svg';

import { colors, shadow } from '../../styles/color';
import { gap } from '../../styles/token';

const FAB_SIZE = 44;
const ICON_SIZE = 18;
const FAB_ICON_COLOR = colors.fgNeutralInverted;

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
  onFeedPress,
  onLetterPress,

  // 외부에서 열림 상태를 제어할 때 사용
  open,

  // open을 전달하지 않을 때 최초 상태
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
    onPress => {
      onPress?.();

      if (closeOnActionPress) {
        changeOpen(false);
      }
    },
    [changeOpen, closeOnActionPress],
  );

  const handleFeedPress = useCallback(() => {
    handleActionPress(onFeedPress);
  }, [handleActionPress, onFeedPress]);

  const handleLetterPress = useCallback(() => {
    handleActionPress(onLetterPress);
  }, [handleActionPress, onLetterPress]);

  return (
    <View style={[styles.container, style]}>
      {isOpen && (
        <>
          {/* 가장 위: 피드 작성 */}
          <FABButton
            icon={
              <FeedIcon
                width={ICON_SIZE}
                height={ICON_SIZE}
                color={FAB_ICON_COLOR}
              />
            }
            accessibilityLabel="피드 작성"
            onPress={handleFeedPress}
          />

          {/* 가운데: 편지 작성 */}
          <FABButton
            icon={
              <LetterIcon
                width={ICON_SIZE}
                height={ICON_SIZE}
                color={FAB_ICON_COLOR}
              />
            }
            accessibilityLabel="편지 작성"
            onPress={handleLetterPress}
          />
        </>
      )}

      {/* 가장 아래: 열기 또는 닫기 */}
      <FABButton
        icon={
          isOpen ? (
            <CloseIcon
              width={ICON_SIZE}
              height={ICON_SIZE}
            />
          ) : (
            <PlusIcon
              width={ICON_SIZE}
              height={ICON_SIZE}
              color={FAB_ICON_COLOR}
            />
          )
        }
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

    borderRadius: FAB_SIZE / 2,

    ...shadow.middleDown,
  },

  darkButton: {
    backgroundColor: colors.bgNeutralSolid,
  },

  lightButton: {
    backgroundColor: colors.bgLayerDefault,
  },

  pressed: {
    opacity: 0.8,
  },
});

export default memo(FAB);