import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

/**
 * progress 가 0 이면 children 을 가운데에, 1 이면 왼쪽에서 startInset 만큼 띄운 곳에 둔다.
 * 사이 값에서는 양쪽 빈 공간의 flexGrow 비율을 바꿔 가며 옮겨가서 children 폭을 잴 필요가 없다.
 *
 * @param {import('react-native-reanimated').SharedValue<number>} progress 0 ~ 1
 * @param {number} [startInset] progress 1 일 때 왼쪽 여백
 */
const CenterToStartRow = ({ progress, startInset = 0, style, children }) => {
  const leadingStyle = useAnimatedStyle(() => ({
    flexGrow: 1 - progress.value,
    width: startInset * progress.value,
  }));

  return (
    <View style={[styles.row, style]}>
      <Animated.View style={leadingStyle} />
      {children}
      <View style={styles.trailing} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  trailing: {
    flexGrow: 1,
  },
});

export default CenterToStartRow;
