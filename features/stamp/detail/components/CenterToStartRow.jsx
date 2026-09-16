import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

/**
 * progress 가 0 이면 children 을 가운데에, 1 이면 왼쪽에서 startInset 만큼 띄운 곳에 둔다.
 * 줄 폭과 children 폭은 progress 와 상관없이 일정해서 한 번 재 두고 translateX 로만 옮긴다.
 * (flexGrow/width 같은 레이아웃 값을 매 프레임 바꾸면 시트를 움직이는 동안 프레임이 밀려 튄다)
 *
 * @param {import('react-native-reanimated').SharedValue<number>} progress 0 ~ 1
 * @param {number} [startInset] progress 1 일 때 왼쪽 여백
 */
const CenterToStartRow = ({ progress, startInset = 0, style, children }) => {
  const rowWidth = useSharedValue(0);
  const contentWidth = useSharedValue(0);

  const handleRowLayout = useCallback(
    event => {
      rowWidth.value = event.nativeEvent.layout.width;
    },
    [rowWidth],
  );

  const handleContentLayout = useCallback(
    event => {
      contentWidth.value = event.nativeEvent.layout.width;
    },
    [contentWidth],
  );

  const contentStyle = useAnimatedStyle(() => {
    const centerLeft = Math.max(0, (rowWidth.value - contentWidth.value) / 2);

    return {
      transform: [{ translateX: interpolate(progress.value, [0, 1], [centerLeft, startInset]) }],
    };
  });

  return (
    // 끌어올렸을 때 오른쪽 끝을 넘지 않도록 children 폭은 startInset 만큼 비워 둔 폭까지만 쓴다
    <View style={[styles.row, { paddingRight: startInset }, style]} onLayout={handleRowLayout}>
      <Animated.View style={[styles.content, contentStyle]} onLayout={handleContentLayout}>
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexShrink: 1,
  },
});

export default CenterToStartRow;
