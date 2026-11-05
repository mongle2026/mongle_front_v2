import { StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';

import logoSymbolMotion from '../../assets/logo/logo_symbol_motion.json';

import { colors } from '../../shared/styles/color';
import { typo } from '../../shared/styles/typo';
import { gap } from '../../shared/styles/token';

// 로고 모션 원본 크기(120 × 120)
const LOGO_SIZE = 120;

// 앱을 새로 켤 때마다 시작 준비가 끝날 때까지 보여 주는 스플래시
const AppSplash = () => (
  <View style={styles.container}>
    {/* 심볼 모션을 한 번 재생하고 마지막 프레임에 멈춘다 */}
    <LottieView
      source={logoSymbolMotion}
      autoPlay
      loop={false}
      style={styles.logo}
    />
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

  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },

  text: {
    ...typo.suitLabelXLargeStrong,
    color: colors.fgNeutralPrimary,
    textAlign: 'center',
  },
});

export default AppSplash;
