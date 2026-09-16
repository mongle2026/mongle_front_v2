import { memo, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import SuitSafeText from '../../../../shared/components/atomic/SuitSafeText';
import { colors } from '../../../../shared/styles/color';
import { typo } from '../../../../shared/styles/typo';
import { gap, padding } from '../../../../shared/styles/token';
import { formatDate } from '../../../../shared/utils/dateUtils';

import Stamp, { getStampHeight } from '../../components/Stamp';

import CenterToStartRow from './CenterToStartRow';

// 시트가 처음 떴을 때(가운데 큰 우표) / 끌어올렸을 때(왼쪽 작은 우표)의 우표 크기.
// 우표는 큰 크기로 한 번만 그리고 scale 로 줄인다.
export const COLLAPSED_STAMP_WIDTH = 160;
const COLLAPSED_STAMP_HEIGHT = getStampHeight(COLLAPSED_STAMP_WIDTH);
const EXPANDED_STAMP_WIDTH = 44;
const EXPANDED_STAMP_HEIGHT = getStampHeight(EXPANDED_STAMP_WIDTH);
const EXPANDED_STAMP_SCALE = EXPANDED_STAMP_WIDTH / COLLAPSED_STAMP_WIDTH;

// 끌어올렸을 때 우표 / 텍스트의 왼쪽 위치 (padding XL + 우표 + gap L 의 가로 배치)
const EXPANDED_STAMP_LEFT = padding.XL;
const EXPANDED_TEXT_LEFT = EXPANDED_STAMP_LEFT + EXPANDED_STAMP_WIDTH + gap.L;

// 처음에는 우표 아래 gap L 만큼 띄워 텍스트를 둔다
const COLLAPSED_TEXT_TOP = COLLAPSED_STAMP_HEIGHT + gap.L;

// 텍스트 두 줄 높이의 어림값. 실제 높이는 onLayout 으로 잰다.
const ESTIMATED_TEXT_HEIGHT = typo.suitTitleMedium.lineHeight + typo.suitBodyMedium.lineHeight;

// Figma 지정값 (대응하는 색 토큰이 없음)
const TITLE_COLOR = '#000000';

// 불러오기 전에도 줄 높이를 유지해 레이아웃이 튀지 않게 한다
const EMPTY_TEXT = ' ';

const getCollapsedHeight = textHeight => {
  'worklet';
  return COLLAPSED_TEXT_TOP + textHeight;
};

const getExpandedHeight = textHeight => {
  'worklet';
  return Math.max(EXPANDED_STAMP_HEIGHT, textHeight);
};

/**
 * 우표 상세 BottomSheet 상단의 우표 + "n개 수집" / "최초 수집일 yy.mm.dd".
 * progress 를 따라 세로 배치(가운데 큰 우표 아래 텍스트)에서
 * 가로 배치(왼쪽 작은 우표 옆 텍스트)로 이어서 바뀐다.
 *
 * @param {string} stampCode
 * @param {number} [count] 불러오기 전에는 비워둔다
 * @param {string|Date} [firstCollectedAt]
 * @param {import('react-native-reanimated').SharedValue<number>} progress 0 = 처음 높이, 1 = 끌어올린 높이
 * @param {(height: number) => void} [onCollapsedHeightChange] 세로 배치일 때의 높이 (시트 처음 높이 계산용)
 */
const StampSummary = ({ stampCode, count, firstCollectedAt, progress, onCollapsedHeightChange }) => {
  const title = count == null ? EMPTY_TEXT : `${count}개 수집`;
  const caption = firstCollectedAt ? `최초 수집일 ${formatDate(firstCollectedAt)}` : EMPTY_TEXT;

  const textHeight = useSharedValue(ESTIMATED_TEXT_HEIGHT);

  // 텍스트 묶음은 transform 으로만 움직여서 높이가 progress 와 상관없이 일정하다
  const handleTextLayout = useCallback(
    event => {
      const { height } = event.nativeEvent.layout;
      textHeight.value = height;
      onCollapsedHeightChange?.(Math.ceil(getCollapsedHeight(height)));
    },
    [onCollapsedHeightChange, textHeight],
  );

  // 높이가 줄어드는 만큼 아래 프로필 줄과 편지 목록이 따라 올라온다
  const containerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      progress.value,
      [0, 1],
      [getCollapsedHeight(textHeight.value), getExpandedHeight(textHeight.value)],
    ),
  }));

  const stampStyle = useAnimatedStyle(() => {
    const expandedTop = (getExpandedHeight(textHeight.value) - EXPANDED_STAMP_HEIGHT) / 2;

    return {
      transform: [
        { translateY: interpolate(progress.value, [0, 1], [0, expandedTop]) },
        { scale: interpolate(progress.value, [0, 1], [1, EXPANDED_STAMP_SCALE]) },
      ],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const expandedTop = (getExpandedHeight(textHeight.value) - textHeight.value) / 2;

    return {
      transform: [{ translateY: interpolate(progress.value, [0, 1], [COLLAPSED_TEXT_TOP, expandedTop]) }],
    };
  });

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <CenterToStartRow progress={progress} startInset={EXPANDED_STAMP_LEFT} style={styles.layer}>
        <Animated.View style={[styles.stamp, stampStyle]}>
          <Stamp stampCode={stampCode} width={COLLAPSED_STAMP_WIDTH} />
        </Animated.View>
      </CenterToStartRow>

      {/* 줄마다 폭이 달라서 가운데 정렬도 줄마다 따로 한다 */}
      <Animated.View style={[styles.layer, textStyle]} onLayout={handleTextLayout}>
        <CenterToStartRow progress={progress} startInset={EXPANDED_TEXT_LEFT}>
          <SuitSafeText style={[styles.text, styles.title]} numberOfLines={1}>
            {title}
          </SuitSafeText>
        </CenterToStartRow>
        <CenterToStartRow progress={progress} startInset={EXPANDED_TEXT_LEFT}>
          <SuitSafeText style={[styles.text, styles.caption]} numberOfLines={1}>
            {caption}
          </SuitSafeText>
        </CenterToStartRow>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  stamp: {
    transformOrigin: 'left top',
  },

  text: {
    flexShrink: 1,
  },
  title: {
    ...typo.suitTitleMedium,
    color: TITLE_COLOR,
  },
  caption: {
    ...typo.suitBodyMedium,
    color: colors.fgNeutralSubtle,
  },
});

export default memo(StampSummary);
