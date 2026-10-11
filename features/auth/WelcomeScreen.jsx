import { Platform, StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as AppleAuthentication from 'expo-apple-authentication';

import LogoSigniture from '../../assets/logo/logo_signiture.svg';
import IcKakao from '../../assets/icons/ic_kakao.svg';

import { useGlobalOverlay } from '../../shared/providers/GlobalOverlayProvider';
import { getApiErrorMessage } from '../../shared/api/client';
import useKakaoLogin from './hooks/useKakaoLogin';
import useAppleLogin from './hooks/useAppleLogin';

import { colors } from '../../shared/styles/color';
import { typo } from '../../shared/styles/typo';
import { gap, padding, radius } from '../../shared/styles/token';

// 카카오 · Apple 버튼 높이를 맞춘다 (Apple 버튼은 높이를 꼭 지정해야 보인다)
const SOCIAL_BUTTON_HEIGHT = 52;

// 카카오 로그인 디자인 가이드: 컨테이너 #FEE500, 심볼 #000000, 레이블 #000000 85%, radius 12
const KAKAO_CONTAINER_COLOR = '#FEE500';
const KAKAO_LABEL_COLOR = 'rgba(0, 0, 0, 0.85)';
const KAKAO_SYMBOL_SIZE = 18;

const WelcomeScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { showToast } = useGlobalOverlay();

  // 신규 유저만 약관 화면으로 보낸다. 기존 유저는 로그인되면 RootNavigator가 MainTabs로 바꾼다
  const handleNewUser = ({ signupToken, suggestedNickname }) => {
    navigation.navigate('Terms', { signupToken, suggestedNickname });
  };

  const showLoginErrorToast = (error, fallbackMessage) => {
    showToast({
      message: getApiErrorMessage(error, fallbackMessage),
      icon: 'alert',
      iconColor: colors.fgCriticalInverted,
      bottomOffset: insets.bottom,
    });
  };

  const { loginWithKakao, isLoggingIn: isKakaoLoggingIn } = useKakaoLogin({
    onNewUser: handleNewUser,
    onError: error => showLoginErrorToast(error, '카카오로 로그인하지 못했습니다.'),
  });

  const { loginWithApple, isLoggingIn: isAppleLoggingIn } = useAppleLogin({
    onNewUser: handleNewUser,
    onError: error => showLoginErrorToast(error, 'Apple로 로그인하지 못했습니다.'),
  });

  // 한쪽 로그인이 진행 중이면 다른 버튼도 막는다
  const isLoggingIn = isKakaoLoggingIn || isAppleLoggingIn;

  const handleKakaoPress = () => {
    if (isLoggingIn) return;

    loginWithKakao();
  };

  const handleApplePress = () => {
    if (isLoggingIn) return;

    loginWithApple();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.brand}>
          <LogoSigniture />
          <Text style={styles.tagline}>당신의 추억이 음악으로 남는 곳</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={handleKakaoPress}
          style={styles.kakaoButton}
        >
          <IcKakao width={KAKAO_SYMBOL_SIZE} height={KAKAO_SYMBOL_SIZE} />
          <Text style={styles.kakaoLabel}>카카오로 시작하기</Text>
        </Pressable>

        {/* Sign in with Apple은 iOS에서만 제공한다 */}
        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={radius.XL}
            onPress={handleApplePress}
            style={styles.appleButton}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSurface,
  },

  // footer를 뺀 나머지 영역의 가운데에 로고를 둔다
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  brand: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: gap.XL,
  },

  tagline: {
    ...typo.suitLabelXLargeStrong,
    color: colors.fgNeutralSecondary,
    textAlign: 'center',
  },

  footer: {
    width: '100%',
    padding: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.M,
  },

  kakaoButton: {
    alignSelf: 'stretch',
    height: SOCIAL_BUTTON_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap.M,
    borderRadius: radius.XL,
    backgroundColor: KAKAO_CONTAINER_COLOR,
  },

  kakaoLabel: {
    ...typo.suitLabelXLargeStrong,
    color: KAKAO_LABEL_COLOR,
  },

  appleButton: {
    width: '100%',
    height: SOCIAL_BUTTON_HEIGHT,
  },
});

export default WelcomeScreen;
