import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

// bottomInset: 목록 하단이 FAB에 가려지지 않도록 확보할 여백
// onPressStamp: 우표를 누르면 stampCode 와 함께 호출
const StampSection = ({ bottomInset = 0, onPressStamp }) => {
  // TODO: 우표 목록 (features/stamp/components/Stamp 사용, 누르면 onPressStamp(stampCode))
  return <View style={[styles.container, { paddingBottom: bottomInset }]} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});

export default memo(StampSection);
