import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors, toTransparent } from '../../../styles/color';
import { padding, radius } from '../../../styles/token';

import Items from './Items';

const DEFAULT_TABS = ['탭1', '탭2', '탭3', '탭4', '탭5', '탭6'];
// 하단 그라데이션 높이. 아래 목록이 이 높이만큼 Tabs 밑으로 들어와야 그라데이션이 보인다
export const TABS_BOTTOM_FADE_HEIGHT = padding.XL;

// 활성 칩 배경이 옆 탭으로 미끄러지는 시간 (글자색도 같은 속도로 바뀐다)
const ACTIVE_TIMING = { duration: 260, easing: Easing.out(Easing.cubic) };

// 활성 탭이 가려져 있으면 스크롤해 보여줄 때 양옆에 남길 여유
const SCROLL_INTO_VIEW_MARGIN = padding.XL;

const playSelectionHaptic = () => {
  void Haptics.selectionAsync().catch(() => {
    /* 햅틱을 지원하지 않는 환경에서도 탭 전환은 그대로 동작한다 */
  });
};

const Tabs = ({
  tabs = DEFAULT_TABS,
  activeIndex = 0,
  onChange,
  // 탭 영역과 그라데이션 색. #rrggbb 형식이어야 한다 (뒤에 00을 붙여 투명색을 만든다)
  backgroundColor = colors.bgBase,
  style,
}) => {
  const fadeColors = [toTransparent(backgroundColor), backgroundColor];

  const [showRightFade, setShowRightFade] = useState(false);
  const scrollRef = useRef({ layoutWidth: 0, contentWidth: 0, x: 0 });
  const scrollViewRef = useRef(null);

  /*
   * 활성 표시: 각 탭 칩의 위치 · 너비를 재 두고, 검은 칩 배경 하나가 그 사이를 미끄러진다.
   * activePosition 은 탭 인덱스를 소수로 움직이는 값이라 칩 배경 위치와 글자색이 함께 따라간다.
   */
  const [itemLayouts, setItemLayouts] = useState([]);
  const layoutXs = useSharedValue([]);
  const layoutWidths = useSharedValue([]);
  const activePosition = useSharedValue(activeIndex);
  const isMeasured = itemLayouts.length === tabs.length && itemLayouts.every(Boolean);

  useEffect(() => {
    activePosition.value = withTiming(activeIndex, ACTIVE_TIMING);
  }, [activeIndex, activePosition]);

  useEffect(() => {
    if (!isMeasured) return;
    layoutXs.value = itemLayouts.map(layout => layout.x);
    // 탭 wrapper 의 padding(XXS)을 뺀 안쪽 칩 너비
    layoutWidths.value = itemLayouts.map(layout => layout.width - padding.XXS * 2);
  }, [isMeasured, itemLayouts, layoutXs, layoutWidths]);

  // 넘치는 탭 목록에서 활성 탭이 화면 밖에 있으면 보이는 곳까지 스크롤한다
  useEffect(() => {
    const layout = itemLayouts[activeIndex];
    const { layoutWidth, x } = scrollRef.current;
    if (!layout || !layoutWidth) return;

    const left = layout.x - SCROLL_INTO_VIEW_MARGIN;
    const right = layout.x + layout.width + SCROLL_INTO_VIEW_MARGIN - layoutWidth;

    if (left < x) {
      scrollViewRef.current?.scrollTo({ x: Math.max(left, 0), animated: true });
    } else if (right > x) {
      scrollViewRef.current?.scrollTo({ x: right, animated: true });
    }
  }, [activeIndex, itemLayouts]);

  const activeChipStyle = useAnimatedStyle(() => {
    const xs = layoutXs.value;
    const widths = layoutWidths.value;

    if (xs.length === 0) {
      return { opacity: 0 };
    }

    if (xs.length === 1) {
      return { opacity: 1, width: widths[0], transform: [{ translateX: xs[0] }] };
    }

    const indexes = xs.map((_, index) => index);

    return {
      opacity: 1,
      width: interpolate(activePosition.value, indexes, widths, 'clamp'),
      transform: [
        { translateX: interpolate(activePosition.value, indexes, xs, 'clamp') },
      ],
    };
  });

  const handleItemLayout = useCallback((index, event) => {
    const { x, width } = event.nativeEvent.layout;

    setItemLayouts(prev => {
      if (prev[index]?.x === x && prev[index]?.width === width) return prev;

      const next = [...prev];
      next[index] = { x, width };
      return next;
    });
  }, []);

  const handlePressTab = index => {
    if (index !== activeIndex) playSelectionHaptic();
    onChange?.(index);
  };

  // 탭이 넘치고, 아직 오른쪽 끝까지 스크롤하지 않았을 때만 오른쪽 fade 표시
  const updateRightFade = () => {
    const { layoutWidth, contentWidth, x } = scrollRef.current;
    setShowRightFade(contentWidth > layoutWidth && x + layoutWidth < contentWidth - 1);
  };

  return (
    <View style={[styles.container, style]}>
      {/* 탭 영역은 단색, 하단 패딩 영역은 배경색 → 투명 그라데이션 */}
      <View style={[styles.background, { backgroundColor }]} />

      <LinearGradient
        pointerEvents="none"
        colors={fadeColors}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.fade}
      />

      {/* 탭이 화면 너비를 넘으면 가로 스크롤 */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.itemContainer}
        onLayout={(e) => {
          scrollRef.current.layoutWidth = e.nativeEvent.layout.width;
          updateRightFade();
        }}
        onContentSizeChange={(width) => {
          scrollRef.current.contentWidth = width;
          updateRightFade();
        }}
        onScroll={(e) => {
          scrollRef.current.x = e.nativeEvent.contentOffset.x;
          updateRightFade();
        }}
        scrollEventThrottle={16}
      >
        {/* 활성 칩 배경. 탭 글자 뒤에 깔리도록 먼저 그린다 */}
        <Animated.View
          pointerEvents="none"
          style={[styles.activeChip, activeChipStyle]}
        />

        {tabs.map((label, index) => (
          <Items
            key={`${label}-${index}`}
            label={label}
            index={index}
            isActive={index === activeIndex}
            activePosition={isMeasured ? activePosition : null}
            onPress={() => handlePressTab(index)}
            onLayout={event => handleItemLayout(index, event)}
          />
        ))}
      </ScrollView>

      {/* ScrollView 위에 겹치도록 뒤에 렌더링 */}
      {showRightFade && (
        <LinearGradient
          pointerEvents="none"
          colors={fadeColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.rightFade}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 1,
    paddingTop: padding.M,
    paddingBottom: TABS_BOTTOM_FADE_HEIGHT,
  },

  scroll: {
    flexGrow: 0,
  },

  itemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: padding.M,
  },

  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: TABS_BOTTOM_FADE_HEIGHT,
  },

  rightFade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: TABS_BOTTOM_FADE_HEIGHT,
    width: 100,
  },

  // Items 의 wrapper(padding XXS) 안쪽 칩 크기에 맞춘다
  activeChip: {
    position: 'absolute',
    top: padding.XXS,
    bottom: padding.XXS,
    left: padding.XXS,
    borderRadius: radius.XS,
    backgroundColor: colors.fillNeutralStrong,
  },

  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: TABS_BOTTOM_FADE_HEIGHT,
  },
});

export default memo(Tabs);
