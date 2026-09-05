import React, { memo, useCallback, useState, } from 'react';
import { Pressable, StyleSheet, Text, View, } from 'react-native';

import FeedIcon from '../../../assets/icons/ic_feed.svg';
import LetterIcon from '../../../assets/icons/ic_letter.svg';
import PlusIcon from '../../../assets/icons/ic_plus.svg';
import XIcon from '../../../assets/icons/ic_x.svg';

import { colors, shadow } from '../../styles/color';
import { gap, padding, radius } from '../../styles/token';
import { typo } from '../../styles/typo';

const TOGGLE_ICON_SIZE = 16;
const ACTION_ICON_SIZE = 20;

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

  return (
    <View style={[styles.container, style]}>
      {isOpen && (
        <View style={styles.expandedRow}>
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
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isOpen ? '작성 메뉴 닫기' : '작성 메뉴 열기'
        }
        accessibilityState={{ expanded: isOpen }}
        onPress={handleToggle}
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
