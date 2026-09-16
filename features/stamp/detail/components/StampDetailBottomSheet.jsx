import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { BottomSheetFooter } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomSheet, {
  BottomSheetFlatList,
  DRAG_HANDLE_HEIGHT,
} from '../../../../shared/components/overlay/BottomSheet';
import { colors } from '../../../../shared/styles/color';
import { gap, padding } from '../../../../shared/styles/token';

import SenderProfileList from './SenderProfileList';
import StampLetterItem from './StampLetterItem';
import StampSummary, { ESTIMATED_COLLAPSE_DISTANCE } from './StampSummary';

// 처음 뜰 때 보여줄 상단 영역(우표 + 텍스트 + 프로필 줄) 높이의 어림값.
// 실제 높이는 StampSummary 가 알려주는 값과 불러온 뒤 onLayout 으로 잰 프로필 줄 높이로 바꾼다.
const ESTIMATED_SUMMARY_HEIGHT = 293; // 우표 233 + gap 12 + 텍스트 48
const ESTIMATED_PROFILE_ROW_HEIGHT = 100;

// 데이터가 늦게 오면 이 시간만큼만 기다렸다가 어림값 높이로 먼저 연다
const MAX_OPEN_WAIT_MS = 500;

// 처음 높이에서는 편지가 보이지 않으므로 처음엔 조금만 그린다.
// 편지 한 장이 큰 SVG(봉투 + 우표)라 한 번에 많이 마운트하면 시트가 뜰 때 프레임이 끊긴다.
const LETTER_INITIAL_NUM_TO_RENDER = 2;
const LETTER_MAX_TO_RENDER_PER_BATCH = 2;
const LETTER_WINDOW_SIZE = 5;

// 시트 하단 그라데이션 (이 시트 전용)
const BOTTOM_FADE_HEIGHT = 40;
const BOTTOM_FADE_COLORS = ['rgba(255, 255, 255, 0)', colors.bgLayerDefault];

// 시트의 보이는 하단(처음 높이든 펼친 높이든)에 붙어 다니도록 footer 로 그린다.
// 아래 편지를 누를 수 있게 터치는 통과시킨다.
const BottomFadeFooter = props => (
  <BottomSheetFooter {...props}>
    <LinearGradient pointerEvents="none" colors={BOTTOM_FADE_COLORS} style={styles.bottomFade} />
  </BottomSheetFooter>
);

// StampSummary 는 높이를 고정해 두고 처음 배치를 아래로 넘쳐 그려서,
// 그 아래 요소는 offset 만큼 transform 으로만 내린다 (레이아웃을 매 프레임 바꾸지 않는다)
const FollowSummary = ({ offset, style, onLayout, children }) => {
  const offsetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <Animated.View style={[style, offsetStyle]} onLayout={onLayout}>
      {children}
    </Animated.View>
  );
};

/**
 * 우표 상세 BottomSheet.
 * 처음에는 프로필 줄까지만 보이는 높이로 뜨고, 끌어올리면 전체 높이로 펼쳐지며
 * 끌어올린 만큼 상단이 가로 배치로 이어서 바뀌고, 상단과 편지 목록이 함께 스크롤된다.
 *
 * @param {string} stampCode
 * @param {object|null} detail useStampDetail 의 detail (불러오기 전에는 null)
 * @param {(letter: object) => void} onPressLetter
 * @param {() => void} onClose
 */
const StampDetailBottomSheet = ({ stampCode, detail, onPressLetter, onClose }) => {
  const insets = useSafeAreaInsets();

  // 상단 배치가 끌어올리는 동안 바뀌어서, 처음 높이 계산에 쓰는 높이는 배치와 상관없는 값으로 따로 받는다
  const [summaryHeight, setSummaryHeight] = useState(ESTIMATED_SUMMARY_HEIGHT);
  const [profileRowHeight, setProfileRowHeight] = useState(ESTIMATED_PROFILE_ROW_HEIGHT);
  const topSectionHeight = summaryHeight + profileRowHeight;

  // 시트는 데이터를 받고 프로필 줄 높이까지 반영된 뒤에 올린다.
  // 올라가는 도중에 snapPoints 가 바뀌면 시트가 다시 스냅되며 튀기 때문이다.
  const [isLayoutSettled, setIsLayoutSettled] = useState(false);
  const [isWaitExpired, setIsWaitExpired] = useState(false);

  useEffect(() => {
    if (!detail) return undefined;

    // 불러온 뒤 프로필 줄 onLayout(높이 반영)이 처리될 때까지 두 프레임 기다린다
    let frameId = requestAnimationFrame(() => {
      frameId = requestAnimationFrame(() => setIsLayoutSettled(true));
    });

    return () => cancelAnimationFrame(frameId);
  }, [detail]);

  useEffect(() => {
    const timeoutId = setTimeout(() => setIsWaitExpired(true), MAX_OPEN_WAIT_MS);
    return () => clearTimeout(timeoutId);
  }, []);

  const isReadyToOpen = isLayoutSettled || isWaitExpired;

  // 처음 높이: 프로필 줄이 하단 내비게이션 바에 가리지 않고 다 보이도록 한다.
  // 하단 그라데이션이 프로필 줄의 아래 padding(XL)을 넘어 이름까지 덮지 않게도 확보한다.
  const snapPoints = useMemo(
    () => [
      DRAG_HANDLE_HEIGHT + topSectionHeight + Math.max(insets.bottom, BOTTOM_FADE_HEIGHT - padding.XL),
      '100%',
    ],
    [insets.bottom, topSectionHeight],
  );

  // BottomSheet 가 콘텐츠 아래에 두는 여백(하단 안전영역 + XS)만큼 목록을 화면 끝까지 늘려서
  // 하단 그라데이션 아래로 편지가 흐려지며 지나가게 하고, 마지막 편지는 그 여백 위까지 올라오게 한다
  const listBottomSpace = insets.bottom + padding.XS;

  // 시트의 실제 위치로 레이아웃을 정한다. 드래그 중에도 손가락을 따라가서 배치가 끊기지 않고 이어진다.
  // (gorhom 의 onAnimate/onChange 는 빠르게 끝까지 끌어올리면 호출되지 않는 경우가 있어 쓰지 않는다)
  const animatedIndex = useSharedValue(0);

  // 처음 높이(0) ~ 펼친 높이(1) 사이에서 끌어올린 정도. 닫히며 내려갈 때(음수)는 처음 배치 그대로 둔다.
  const layoutProgress = useDerivedValue(() =>
    interpolate(animatedIndex.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  );

  // StampSummary 아래 요소(프로필 줄, 편지)를 내릴 거리. 끌어올린 만큼 줄어서 펼치면 0 이 된다.
  const collapseDistance = useSharedValue(ESTIMATED_COLLAPSE_DISTANCE);
  const belowSummaryOffset = useDerivedValue(
    () => collapseDistance.value * (1 - layoutProgress.value),
  );

  const handleCollapseDistanceChange = useCallback(
    distance => {
      collapseDistance.value = distance;
    },
    [collapseDistance],
  );

  // 프로필 줄 높이는 배치와 상관없지만, 불러오기 전에는 비어 있어서 불러온 뒤에만 잰다
  const handleProfileRowLayout = useCallback(
    event => {
      if (!detail) return;
      setProfileRowHeight(Math.ceil(event.nativeEvent.layout.height));
    },
    [detail],
  );

  const renderLetter = useCallback(
    ({ item }) => (
      <FollowSummary offset={belowSummaryOffset}>
        <StampLetterItem letter={item} onPress={onPressLetter} />
      </FollowSummary>
    ),
    [onPressLetter, belowSummaryOffset],
  );

  // 상단 영역도 편지 목록과 함께 스크롤되도록 목록의 header 로 넣는다
  const listHeader = useMemo(
    () => (
      <>
        <StampSummary
          stampCode={stampCode}
          count={detail?.count}
          firstCollectedAt={detail?.firstCollectedAt}
          progress={layoutProgress}
          onCollapsedHeightChange={setSummaryHeight}
          onCollapseDistanceChange={handleCollapseDistanceChange}
        />
        <FollowSummary offset={belowSummaryOffset} onLayout={handleProfileRowLayout}>
          <SenderProfileList senders={detail?.senders ?? []} progress={layoutProgress} />
        </FollowSummary>
      </>
    ),
    [
      stampCode,
      detail,
      layoutProgress,
      belowSummaryOffset,
      handleCollapseDistanceChange,
      handleProfileRowLayout,
    ],
  );

  return (
    <BottomSheet
      ready={isReadyToOpen}
      snapPoints={snapPoints}
      animatedIndex={animatedIndex}
      onClose={onClose}
      footerComponent={BottomFadeFooter}
      // 프로필 줄을 가로로 스크롤할 때 시트가 세로 제스처로 먼저 가져가지 않게 한다
      activeOffsetY={[-10, 10]}
      failOffsetX={[-10, 10]}
    >
      <BottomSheetFlatList
        data={detail?.letters ?? []}
        keyExtractor={item => String(item.letterId)}
        renderItem={renderLetter}
        ListHeaderComponent={listHeader}
        ListHeaderComponentStyle={styles.listHeader}
        style={{ marginBottom: -listBottomSpace }}
        contentContainerStyle={[styles.letterContainer, { paddingBottom: listBottomSpace }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={LETTER_INITIAL_NUM_TO_RENDER}
        maxToRenderPerBatch={LETTER_MAX_TO_RENDER_PER_BATCH}
        windowSize={LETTER_WINDOW_SIZE}
      />
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  letterContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: gap.M,
  },
  listHeader: {
    // 목록은 가운데 정렬이라 header 는 폭 전체를 쓰게 하고,
    // 목록의 gap 이 header 와 첫 편지 사이에 더해지지 않게 상쇄한다
    alignSelf: 'stretch',
    marginBottom: -gap.M,
  },
  bottomFade: {
    height: BOTTOM_FADE_HEIGHT,
  },
});

export default memo(StampDetailBottomSheet);
