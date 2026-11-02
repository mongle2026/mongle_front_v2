import { StyleSheet, Text, View } from 'react-native';

import LogoSigniture from '../../assets/logo/logo_signiture.svg';

import { colors } from '../../shared/styles/color';
import { typo } from '../../shared/styles/typo';
import { gap } from '../../shared/styles/token';

// 로고 원본 크기(120 × 64)
const LOGO_WIDTH = 120;
const LOGO_HEIGHT = 64;

// 앱을 새로 켤 때마다 시작 준비가 끝날 때까지 보여 주는 스플래시
const AppSplash = () => (
  <View style={styles.container}>
    <LogoSigniture width={LOGO_WIDTH} height={LOGO_HEIGHT} />
    <Text style={styles.text}>당신의 추억이 음악으로 남는 곳</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap.XL,
    backgroundColor: colors.bgSurface,
  },

  text: {
    ...typo.suitLabelXLargeStrong,
    color: colors.fgNeutralPrimary,
    textAlign: 'center',
  },
});

export default AppSplash;
