import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

// bottomInset: 목록 하단이 FAB에 가려지지 않도록 확보할 여백
const StampSection = ({ bottomInset = 0 }) => {
  // TODO: 우표 목록
  return <View style={[styles.container, { paddingBottom: bottomInset }]} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});

export default memo(StampSection);
