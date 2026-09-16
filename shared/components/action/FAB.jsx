import React, { memo, useCallback, useEffect, useState, } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import FeedIcon from '../../../assets/icons/ic_feed.svg';
import LetterIcon from '../../../assets/icons/ic_letter.svg';
import PlusIcon from '../../../assets/icons/ic_plus.svg';
import XIcon from '../../../assets/icons/ic_x.svg';

import { colors, shadow } from '../../styles/color';
import { gap, padding, radius } from '../../styles/token';
import { typo } from '../../styles/typo';

const TOGGLE_ICON_SIZE = 16;
const ACTION_ICON_SIZE = 20;

export const FAB_EXPAND_DURATION = 200;

// expandedRow가 숨어 있을 때의 위치: 기본 버튼 바로 뒤(아랫변끼리 맞춤)
// layout animation(exiting)은 행이 레이아웃에서 빠지며 위치가 밀리므로, 닫힘이 끝날 때까지 마운트를 유지하고 직접 애니메이션한다
const EXPANDED_ROW_FALLBACK_OFFSET = 48;

const DEFAULT_LABEL = '새로운 기록 남기기';
const EXPANDED_LABEL = '피드 더 둘러보기';

const ExpandedActionButton = memo(
  ({ icon: Icon, label, onPress, accessibilityLabel }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={styles.expandedButton}
    >
      <Icon
        width={ACTION_ICON_SIZE}
        height={ACTION_ICON_SIZE}
        color={colors.fgNeutralInverted}
      />

      <Text
        numberOfLines={1}
        style={styles.expandedLabel}
      >
        {label}
      </Text>
    </Pressable>
  ),
);

ExpandedActionButton.displayName = 'ExpandedActionButton';

const FAB = ({
  onFeedPress,
  onLetterPress,

  label = DEFAULT_LABEL,
  expandedLabel = EXPANDED_LABEL,

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

  const handleLetterPress = useCallback(() => {
    handleActionPress(onLetterPress);
  }, [handleActionPress, onLetterPress]);

  const handleFeedPress = useCallback(() => {
    handleActionPress(onFeedPress);
  }, [handleActionPress, onFeedPress]);

  const [isRowMounted, setIsRowMounted] = useState(isOpen);
  const progress = useSharedValue(0);
  const toggleHeight = useSharedValue(0);

  useEffect(() => {
    const timing = { duration: FAB_EXPAND_DURATION };

    if (isOpen) {
      setIsRowMounted(true);
      progress.value = withTiming(1, timing);
      return;
    }

    progress.value = withTiming(0, timing, finished => {
      if (finished) scheduleOnRN(setIsRowMounted, false);
    });
  }, [isOpen, progress]);

  const handleToggleLayout = useCallback(event => {
    toggleHeight.value = event.nativeEvent.layout.height;
  }, [toggleHeight]);

  const expandedRowAnimatedStyle = useAnimatedStyle(() => {
    const hiddenOffset = toggleHeight.value > 0
      ? toggleHeight.value + gap.M
      : EXPANDED_ROW_FALLBACK_OFFSET;

    return {
      opacity: progress.value,
      transform: [{ translateY: (1 - progress.value) * hiddenOffset }],
    };
  });

  return (
    <View style={[styles.container, style]}>
      {isRowMounted && (
        <Animated.View
          pointerEvents={isOpen ? 'auto' : 'none'}
          style={[styles.expandedRow, expandedRowAnimatedStyle]}
        >
          <ExpandedActionButton
            icon={LetterIcon}
            label="편지 작성"
            accessibilityLabel="편지 작성"
            onPress={handleLetterPress}
          />

          <ExpandedActionButton
            icon={FeedIcon}
            label="피드 작성"
            accessibilityLabel="피드 작성"
            onPress={handleFeedPress}
          />
        </Animated.View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isOpen ? '작성 메뉴 닫기' : '작성 메뉴 열기'
        }
        accessibilityState={{ expanded: isOpen }}
        onPress={handleToggle}
        onLayout={handleToggleLayout}
        style={styles.defaultButton}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.defaultLabel,
            isOpen && styles.defaultLabelExpanded,
          ]}
        >
          {isOpen ? expandedLabel : label}
        </Text>

        {isOpen ? (
          <XIcon
            width={TOGGLE_ICON_SIZE}
            height={TOGGLE_ICON_SIZE}
            color={colors.fgNeutralMuted}
          />
        ) : (
          <PlusIcon
            width={TOGGLE_ICON_SIZE}
            height={TOGGLE_ICON_SIZE}
            color={colors.fgNeutralMuted}
          />
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: gap.M,
  },

  expandedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: gap.M,
  },

  expandedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.M,
    padding: padding.L,
    borderRadius: radius.S,
    backgroundColor: colors.bgNeutralSolid,
    ...shadow.weakDown,
  },

  expandedLabel: {
    flexShrink: 1,
    color: colors.fgNeutralInverted,
    ...typo.suitLabelMediumStrong,
  },

  defaultButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.M,
    padding: padding.L,
    borderRadius: radius.S,
    backgroundColor: colors.bgLayerDefault,
    ...shadow.weakDown,
    // expandedRow가 이 버튼 뒤로 올라오고 내려가도록 항상 앞에 그린다
    zIndex: 1,
  },

  defaultLabel: {
    flex: 1,
    color: colors.fgNeutralMuted,
    ...typo.suitLabelMediumStrong,
  },

  defaultLabelExpanded: {
    color: colors.fgNeutralSubtle,
  },
});

export default memo(FAB);
