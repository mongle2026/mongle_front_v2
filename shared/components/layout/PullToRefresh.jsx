import { cloneElement, useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, RefreshControl, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useComposedEventHandler,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import RefreshSpinner, { REFRESH_SPINNER_SIZE } from '../feedback/RefreshSpinner';

// 새로고침하는 동안 목록이 내려가 있는 높이. 이만큼 당겼다 놓으면 새로고침한다
const REFRESH_HEIGHT = 56;
// 손가락이 움직인 거리 대비 목록이 내려가는 비율
const PULL_RESISTANCE = 0.5;
// 당김인지 스크롤인지 판단하는 거리. Android ScrollView 가 터치를 가져가는 거리(8dp)보다 짧아야 먼저 판단할 수 있다
const DECIDE_DISTANCE = 4;
const SETTLE_DURATION = 250;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // 목록이 내려간 만큼 아래쪽은 잘라낸다
  clip: {
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
});

// iOS 는 기본 RefreshControl 이 이미 목록을 밀어내므로 그대로 쓴다
const IosPullToRefresh = ({ refreshing, onRefresh, style, children }) => (
  <View style={[styles.container, style]}>
    {cloneElement(children, {
      refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />,
    })}
  </View>
);

// Android 기본 RefreshControl 은 로딩 원만 내려와서, 목록이 밀려 내려가는 동작을 직접 만든다
const AndroidPullToRefresh = ({ refreshing, onRefresh, indicatorOffset = 0, style, children }) => {
  const scrollY = useSharedValue(0);
  const pullDistance = useSharedValue(0);
  const isRefreshing = useSharedValue(false);
  const touchStartX = useSharedValue(0);
  const touchStartY = useSharedValue(0);
  const isDecided = useSharedValue(false);

  // onRefresh 가 끝나기 전이거나 refreshing 이 true 인 동안 목록을 내려 둔다
  const isPendingRef = useRef(false);
  const refreshingRef = useRef(refreshing);

  const syncRefreshing = useCallback(() => {
    const shouldHold = isPendingRef.current || refreshingRef.current;
    isRefreshing.value = shouldHold;
    pullDistance.value = withTiming(shouldHold ? REFRESH_HEIGHT : 0, { duration: SETTLE_DURATION });
  }, [isRefreshing, pullDistance]);

  useEffect(() => {
    refreshingRef.current = refreshing;
    syncRefreshing();
  }, [refreshing, syncRefreshing]);

  const handleRelease = useCallback(async () => {
    isPendingRef.current = true;
    try {
      await onRefresh?.();
    } finally {
      isPendingRef.current = false;
      syncRefreshing();
    }
  }, [onRefresh, syncRefreshing]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .manualActivation(true)
        .onTouchesDown(event => {
          const touch = event.allTouches[0];
          touchStartX.value = touch.absoluteX;
          touchStartY.value = touch.absoluteY;
          isDecided.value = false;
        })
        // 목록 맨 위에서 아래로 당길 때만 시작하고, 나머지는 바로 포기해 스크롤에 넘긴다
        .onTouchesMove((event, manager) => {
          if (isDecided.value) return;

          const touch = event.allTouches[0];
          const dx = touch.absoluteX - touchStartX.value;
          const dy = touch.absoluteY - touchStartY.value;
          if (Math.abs(dx) < DECIDE_DISTANCE && Math.abs(dy) < DECIDE_DISTANCE) return;

          isDecided.value = true;
          const isPullingDown = dy > Math.abs(dx);
          const isAtTop = scrollY.value <= 0;

          if (isPullingDown && isAtTop && !isRefreshing.value && event.numberOfTouches === 1) {
            manager.activate();
          } else {
            manager.fail();
          }
        })
        .onUpdate(event => {
          pullDistance.value = Math.max(0, event.translationY) * PULL_RESISTANCE;
        })
        .onEnd(() => {
          if (pullDistance.value < REFRESH_HEIGHT) {
            pullDistance.value = withTiming(0, { duration: SETTLE_DURATION });
            return;
          }

          isRefreshing.value = true;
          pullDistance.value = withTiming(REFRESH_HEIGHT, { duration: SETTLE_DURATION });
          scheduleOnRN(handleRelease);
        })
        .onFinalize((_event, success) => {
          if (!success && !isRefreshing.value) {
            pullDistance.value = withTiming(0, { duration: SETTLE_DURATION });
          }
        }),
    [handleRelease, isDecided, isRefreshing, pullDistance, scrollY, touchStartX, touchStartY]
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
    },
  });
  // 자식이 이미 onScroll(useAnimatedScrollHandler)을 쓰고 있으면 함께 호출한다
  const composedScrollHandler = useComposedEventHandler([scrollHandler, children.props.onScroll ?? null]);

  const spinnerProgress = useDerivedValue(() =>
    isRefreshing.value ? 1 : Math.min(pullDistance.value / REFRESH_HEIGHT, 1)
  );

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pullDistance.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.container, styles.clip, style]}>
        {/* 목록보다 먼저 그려서, 목록이 내려간 만큼만 드러나게 한다 */}
        <View
          pointerEvents="none"
          style={[styles.indicator, { top: indicatorOffset + (REFRESH_HEIGHT - REFRESH_SPINNER_SIZE) / 2 }]}
        >
          <RefreshSpinner progress={spinnerProgress} spinning={isRefreshing} />
        </View>

        <Animated.View style={[styles.content, contentStyle]}>
          {cloneElement(children, { onScroll: composedScrollHandler, scrollEventThrottle: 16 })}
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

/**
 * 당겨서 새로고침. 맨 위에서 당기면 목록이 밀려 내려가고, 드러난 자리에 스피너가 돈다.
 * iOS 는 기본 RefreshControl, Android 는 같은 동작을 제스처로 직접 구현한다.
 *
 * children 은 스크롤 컴포넌트 하나여야 하고, Android 에서 onScroll 을 붙이기 위해
 * reanimated 의 Animated.ScrollView / Animated.FlatList 를 써야 한다.
 * 자식에 onScroll 을 줄 때도 useAnimatedScrollHandler 로 만든 핸들러만 쓸 수 있다.
 *
 * @param {boolean} refreshing
 * @param {() => void | Promise<void>} onRefresh Promise 를 돌려주면 끝날 때까지 스피너를 유지한다
 * @param {number} [indicatorOffset] 스피너를 위에서 내릴 거리 (Android). 목록 위를 다른 요소가 덮고 있을 때 쓴다
 * @param {object} [style] 감싸는 View 스타일. 목록의 위치·여백(margin 등)은 여기에 준다
 */
const PullToRefresh = Platform.OS === 'android' ? AndroidPullToRefresh : IosPullToRefresh;

export default PullToRefresh;
