import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../shared/styles/color';
import { padding } from '../../shared/styles/token';
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from '../../shared/components/action/Button';
import { FONT } from '../../shared/styles/fontType';

// 프로필 탭. 화면 내용은 아직 없다
// 개발 빌드에서는 컴포넌트 카탈로그로 가는 버튼을 보여준다
const ProfileScreen = ({ navigation }) => (
  <SafeAreaView edges={['top']} style={styles.container}>
    {__DEV__ && (
      <Button
        variant={BUTTON_VARIANT.WEAK}
        size={BUTTON_SIZE.M}
        font={FONT.SUIT}
        onPress={() => navigation.navigate('Catalog')}
        style={styles.catalogButton}
      >
        컴포넌트 카탈로그
      </Button>
    )}
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgLayerBase,
  },

  catalogButton: {
    alignSelf: 'flex-start',
    margin: padding.XL,
  },
});

export default ProfileScreen;
