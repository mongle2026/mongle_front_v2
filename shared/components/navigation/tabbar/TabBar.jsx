import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '../../../styles/color';
import Items from './Items';

const DEFAULT_TABS = ['탭1', '탭2'];

// 활성 탭 밑줄이 옆으로 미끄러지는 시간
const INDICATOR_DURATION = 200;
const INDICATOR_HEIGHT = 1.5;

const TabBar = ({
  tabs = DEFAULT_TABS,
  activeIndex = 0,
  onChange,
  style,
}) => {
  const containerWidth = useSharedValue(0);
  const position = useSharedValue(activeIndex);

  useEffect(() => {
    position.value = withTiming(activeIndex, { duration: INDICATOR_DURATION });
  }, [activeIndex, position]);

  const tabCount = tabs.length;

  // 측정 전(너비 0)에는 그리지 않는다
  const indicatorStyle = useAnimatedStyle(() => {
    const tabWidth = tabCount > 0 ? containerWidth.value / tabCount : 0;

    return {
      opacity: tabWidth > 0 ? 1 : 0,
      width: tabWidth,
      transform: [{ translateX: tabWidth * position.value }],
    };
  });

  return (
    <View
      style={[styles.container, style]}
      onLayout={event => {
        containerWidth.value = event.nativeEvent.layout.width;
      }}
    >
      {tabs.map((label, index) => (
        <Items
          key={`${label}-${index}`}
          label={label}
          isActive={index === activeIndex}
          onPress={() => onChange?.(index)}
          style={styles.tab}
        />
      ))}

      <Animated.View pointerEvents="none" style={[styles.indicator, indicatorStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },

  tab: {
    flex: 1,
  },

  // 활성 탭 밑줄. 탭마다 있는 1px 회색 줄 위에 겹쳐 그린다
  indicator: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: INDICATOR_HEIGHT,
    backgroundColor: colors.strokeNeutralPrimary,
  },
});

export default memo(TabBar);
