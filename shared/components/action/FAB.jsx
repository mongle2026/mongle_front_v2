import React, { memo, useCallback, useEffect, useState, } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming, } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import FeedIcon from '../../../assets/icons/ic_feed.svg';
import LetterIcon from '../../../assets/icons/ic_letter.svg';
import PlusIcon from '../../../assets/icons/ic_plus.svg';
import XIcon from '../../../assets/icons/ic_x.svg';

import usePressAnimation from '../../hooks/usePressAnimation';
import { colors, shadow } from '../../styles/color';
import { gap, padding, radius } from '../../styles/token';
import { typo } from '../../styles/typo';

const TOGGLE_ICON_SIZE = 16;
const ACTION_ICON_SIZE = 20;

export const FAB_EXPAND_DURATION = 240;

// 열 때는 빠르게 나왔다가 천천히 멈추고, 닫을 때는 천천히 출발해 빠르게 들어간다
const OPEN_EASING = Easing.out(Easing.cubic);
const CLOSE_EASING = Easing.inOut(Easing.cubic);

// 기본 버튼의 문구 · 아이콘 전환: 이전 문구는 위로 살짝 빠지고 새 문구가 아래에서 올라오며,
// + 아이콘은 45° 돌며 × 로 바뀐다
const LABEL_SHIFT = 6;
const ICON_ROTATE_DEG = 45;

// 펼쳐지는 두 버튼(피드 작성 · 편지 작성)을 살짝 시간차로 올린다
const ROW_STAGGER = 0.15;

// expandedRow가 숨어 있을 때의 위치: 기본 버튼 바로 뒤(아랫변끼리 맞춤)
// layout animation(exiting)은 행이 레이아웃에서 빠지며 위치가 밀리므로, 닫힘이 끝날 때까지 마운트를 유지하고 직접 애니메이션한다
const EXPANDED_ROW_FALLBACK_OFFSET = 48;

const DEFAULT_LABEL = '새로운 기록 남기기';

const ExpandedActionButton = memo(
  ({ icon: Icon, label, onPress, accessibilityLabel }) => {
    const { animatedStyle, pressHandlers } = usePressAnimation({ onPress });

    return (
      <Animated.View style={[styles.expandedButtonWrapper, animatedStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          {...pressHandlers}
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
      </Animated.View>
    );
  },
);

ExpandedActionButton.displayName = 'ExpandedActionButton';

const FAB = ({
  onFeedPress,
  onLetterPress,

  label = DEFAULT_LABEL,
  // 열렸을 때 문구는 화면마다 다르다 (WriteFab 을 쓰는 화면에서 넘긴다)
  expandedLabel = label,

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

  const {
    animatedStyle: toggleAnimatedStyle,
    pressHandlers: togglePressHandlers,
  } = usePressAnimation({ onPress: handleToggle });

  const [isRowMounted, setIsRowMounted] = useState(isOpen);
  const progress = useSharedValue(0);
  const toggleHeight = useSharedValue(0);

  useEffect(() => {
    const timing = {
      duration: FAB_EXPAND_DURATION,
      easing: isOpen ? OPEN_EASING : CLOSE_EASING,
    };

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
      opacity: interpolate(progress.value, [0, 0.6], [0, 1], 'clamp'),
      transform: [{ translateY: (1 - progress.value) * hiddenOffset }],
    };
  });

  // 두 번째 버튼(편지 작성)은 조금 늦게 따라 올라온다
  const secondActionAnimatedStyle = useAnimatedStyle(() => {
    const delayed = interpolate(progress.value, [ROW_STAGGER, 1], [0, 1], 'clamp');

    return {
      transform: [{ translateY: (1 - delayed) * LABEL_SHIFT * 2 }],
    };
  });

  const defaultLabelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5], [1, 0], 'clamp'),
    transform: [{ translateY: -progress.value * LABEL_SHIFT }],
  }));

  const expandedLabelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.5, 1], [0, 1], 'clamp'),
    transform: [{ translateY: (1 - progress.value) * LABEL_SHIFT }],
  }));

  const plusIconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6], [1, 0], 'clamp'),
    transform: [{ rotate: `${progress.value * ICON_ROTATE_DEG}deg` }],
  }));

  const closeIconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.4, 1], [0, 1], 'clamp'),
    transform: [{ rotate: `${(progress.value - 1) * ICON_ROTATE_DEG}deg` }],
  }));

  return (
    <View style={[styles.container, style]}>
      {isRowMounted && (
        <Animated.View
          pointerEvents={isOpen ? 'auto' : 'none'}
          style={[styles.expandedRow, expandedRowAnimatedStyle]}
        >
          <ExpandedActionButton
            icon={FeedIcon}
            label="피드 작성"
            accessibilityLabel="피드 작성"
            onPress={handleFeedPress}
          />

          <Animated.View style={[styles.expandedButtonWrapper, secondActionAnimatedStyle]}>
            <ExpandedActionButton
              icon={LetterIcon}
              label="편지 작성"
              accessibilityLabel="편지 작성"
              onPress={handleLetterPress}
            />
          </Animated.View>
        </Animated.View>
      )}

      <Animated.View style={[styles.defaultButtonWrapper, toggleAnimatedStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isOpen ? '작성 메뉴 닫기' : '작성 메뉴 열기'
          }
          accessibilityState={{ expanded: isOpen }}
          {...togglePressHandlers}
          onLayout={handleToggleLayout}
          style={styles.defaultButton}
        >
          {/* 닫힘 · 열림 문구와 아이콘을 겹쳐 두고 progress 에 따라 바꿔 보여준다 */}
          <View style={styles.labelStack}>
            <Animated.Text
              numberOfLines={1}
              style={[styles.defaultLabel, defaultLabelAnimatedStyle]}
            >
              {label}
            </Animated.Text>

            <Animated.Text
              numberOfLines={1}
              style={[
                styles.defaultLabel,
                styles.defaultLabelExpanded,
                styles.stackedLabel,
                expandedLabelAnimatedStyle,
              ]}
            >
              {expandedLabel}
            </Animated.Text>
          </View>

          <View style={styles.iconStack}>
            <Animated.View style={plusIconAnimatedStyle}>
              <PlusIcon
                width={TOGGLE_ICON_SIZE}
                height={TOGGLE_ICON_SIZE}
                color={colors.fgNeutralSecondary}
              />
            </Animated.View>

            <Animated.View style={[StyleSheet.absoluteFill, closeIconAnimatedStyle]}>
              <XIcon
                width={TOGGLE_ICON_SIZE}
                height={TOGGLE_ICON_SIZE}
                color={colors.fgNeutralTertiary}
              />
            </Animated.View>
          </View>
        </Pressable>
      </Animated.View>
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

  expandedButtonWrapper: {
    flex: 1,
  },

  expandedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.M,
    padding: padding.L,
    borderRadius: radius.S,
    backgroundColor: colors.fillNeutral,
    ...shadow.weakDown,
  },

  expandedLabel: {
    flexShrink: 1,
    color: colors.fgNeutralInverted,
    ...typo.suitLabelMediumStrong,
  },

  defaultButtonWrapper: {
    width: '100%',
    // expandedRow가 이 버튼 뒤로 올라오고 내려가도록 항상 앞에 그린다
    zIndex: 1,
  },

  defaultButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.M,
    padding: padding.L,
    borderRadius: radius.S,
    backgroundColor: colors.bgSurface,
    ...shadow.weakDown,
  },

  labelStack: {
    flex: 1,
  },

  defaultLabel: {
    color: colors.fgNeutralSecondary,
    ...typo.suitLabelMediumStrong,
  },

  stackedLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  iconStack: {
    width: TOGGLE_ICON_SIZE,
    height: TOGGLE_ICON_SIZE,
  },

  defaultLabelExpanded: {
    color: colors.fgNeutralTertiary,
  },
});

export default memo(FAB);
