import {
  useCallback,
  useEffect,
} from 'react';

import {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useScrollEventsHandlersDefault } from '@gorhom/bottom-sheet';

// 이 거리(px)보다 작은 흔들림은 방향 전환으로 보지 않습니다.
const DIRECTION_THRESHOLD = 4;

/**
 * 스크롤 방향에 따라 접힘 상태를 알려주는 훅.
 * 아래로 스크롤하면 collapsed = true, 위로 스크롤하거나 맨 위에 닿으면 false.
 * 모든 계산은 UI 스레드(worklet)에서 합니다.
 *
 * @param {boolean} enabled false면 항상 펼친 상태로 되돌리고 스크롤을 무시합니다.
 * @returns {{ collapsed: SharedValue<boolean>, scrollEventsHandlersHook: Function, scrollHandler: Function }}
 *   scrollEventsHandlersHook 은 BottomSheetFlatList 에,
 *   scrollHandler 는 Animated.FlatList 같은 일반 스크롤 뷰의 onScroll 에 넘깁니다.
 */
export default function useCollapseOnScroll({
  enabled = true,
} = {}) {
  const collapsed = useSharedValue(false);
  const isEnabled = useSharedValue(enabled);

  const lastOffsetY = useSharedValue(0);
  const lastLayoutHeight = useSharedValue(0);
  const lastContentHeight = useSharedValue(0);

  useEffect(() => {
    isEnabled.value = enabled;

    if (!enabled) {
      collapsed.value = false;
    }
  }, [enabled, isEnabled, collapsed]);

  const handleCollapseOnScroll = useCallback(
    ({
      contentOffset,
      contentSize,
      layoutMeasurement,
    }) => {
      'worklet';

      // iOS 바운스로 범위를 넘는 값은 잘라서 방향이 튀지 않게 합니다.
      const maxOffsetY = Math.max(
        contentSize.height -
          layoutMeasurement.height,
        0,
      );
      const offsetY = Math.min(
        Math.max(contentOffset.y, 0),
        maxOffsetY,
      );

      const deltaY =
        offsetY - lastOffsetY.value;
      const isLayoutChanged =
        layoutMeasurement.height !==
        lastLayoutHeight.value;
      const isContentChanged =
        contentSize.height !==
        lastContentHeight.value;

      lastOffsetY.value = offsetY;
      lastLayoutHeight.value =
        layoutMeasurement.height;
      lastContentHeight.value =
        contentSize.height;

      if (!isEnabled.value) return;

      // 접히고 펼쳐지면서 리스트 높이가 바뀌면 오프셋도 같이
      // 밀리는데, 이걸 사용자 스크롤로 보면 접힘/펼침이 반복됩니다.
      if (isLayoutChanged) return;

      // 위에 페이지가 붙어 maintainVisibleContentPosition 으로
      // 오프셋이 밀릴 때도 사용자 스크롤이 아니므로 무시합니다.
      if (isContentChanged) return;

      if (offsetY <= 0) {
        collapsed.value = false;
        return;
      }

      if (deltaY > DIRECTION_THRESHOLD) {
        collapsed.value = true;
      } else if (deltaY < -DIRECTION_THRESHOLD) {
        collapsed.value = false;
      }
    },
    [
      collapsed,
      isEnabled,
      lastOffsetY,
      lastLayoutHeight,
      lastContentHeight,
    ],
  );

  // gorhom 기본 스크롤 핸들러(시트 드래그와 스크롤 연동)는 그대로 두고
  // onScroll 에만 접힘 계산을 덧붙입니다. gorhom 내부에서 훅으로 호출됩니다.
  const scrollEventsHandlersHook = useCallback(
    (scrollableRef, scrollableContentOffsetY) => {
      const handlers =
        useScrollEventsHandlersDefault(
          scrollableRef,
          scrollableContentOffsetY,
        );
      const { handleOnScroll } = handlers;

      const handleOnScrollWithCollapse =
        useCallback(
          (event, context) => {
            'worklet';
            handleOnScroll?.(event, context);
            handleCollapseOnScroll(event);
          },
          [handleOnScroll],
        );

      return {
        ...handlers,
        handleOnScroll:
          handleOnScrollWithCollapse,
      };
    },
    [handleCollapseOnScroll],
  );

  // BottomSheet 밖의 일반 스크롤 뷰용 (Animated.FlatList onScroll)
  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: handleCollapseOnScroll,
    },
    [handleCollapseOnScroll],
  );

  return {
    collapsed,
    scrollEventsHandlersHook,
    scrollHandler,
  };
}
