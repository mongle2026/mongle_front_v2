import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../shared/styles/color';

// 프로필 탭. 화면 내용은 아직 없다
const ProfileScreen = () => (
  <SafeAreaView edges={['top']} style={styles.container} />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLayerBasement,
  },
});

export default ProfileScreen;
