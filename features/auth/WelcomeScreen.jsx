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

// 카카오 · Apple 버튼 높이와 모서리를 맞춘다 (radius는 카카오 가이드 12)
const SOCIAL_BUTTON_HEIGHT = 54;

// 로고 원본 비율(120 × 64)을 유지한 채 너비만 키운다
const LOGO_WIDTH = 160;
const LOGO_HEIGHT = (LOGO_WIDTH * 64) / 120;
const SOCIAL_BUTTON_RADIUS = radius.XL;

// 카카오 로그인 디자인 가이드: 컨테이너 #FEE500, 심볼 #000000, 레이블 #000000 85% + OS 기본 서체
const KAKAO_CONTAINER_COLOR = '#FEE500';
const KAKAO_LABEL_COLOR = 'rgba(0, 0, 0, 0.85)';
const KAKAO_SYMBOL_SIZE = 15;
const KAKAO_PADDING_X = 15;

// Apple 가이드상 버튼 테두리(stroke)는 바꿀 수 있다
const APPLE_BORDER_WIDTH = 1;
const APPLE_BORDER_COLOR = '#BFBFBF';

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
        <LogoSigniture width={LOGO_WIDTH} height={LOGO_HEIGHT} />
        <Text style={styles.tagline}>당신의 추억이 음악으로 남는 곳</Text>
      </View>

      <View style={styles.footer}>
        {/* Sign in with Apple은 iOS에서만 제공한다. 로고 · 문구 · 비율은 시스템 버튼을 쓰고 테두리만 바깥 View로 입힌다 */}
        {Platform.OS === 'ios' && (
          <View style={styles.appleButtonFrame}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={SOCIAL_BUTTON_RADIUS - APPLE_BORDER_WIDTH}
              onPress={handleApplePress}
              style={styles.appleButton}
            />
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={handleKakaoPress}
          style={styles.kakaoButton}
        >
          <IcKakao width={KAKAO_SYMBOL_SIZE} height={KAKAO_SYMBOL_SIZE} />
          <Text style={styles.kakaoLabel}>카카오 로그인</Text>
        </Pressable>
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
    width: '100%',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
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

  appleButtonFrame: {
    alignSelf: 'stretch',
    height: SOCIAL_BUTTON_HEIGHT,
    borderWidth: APPLE_BORDER_WIDTH,
    borderColor: APPLE_BORDER_COLOR,
    borderRadius: SOCIAL_BUTTON_RADIUS,
    overflow: 'hidden',
  },

  appleButton: {
    width: '100%',
    height: '100%',
  },

  kakaoButton: {
    alignSelf: 'stretch',
    height: SOCIAL_BUTTON_HEIGHT,
    paddingHorizontal: KAKAO_PADDING_X,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap.M,
    borderRadius: SOCIAL_BUTTON_RADIUS,
    backgroundColor: KAKAO_CONTAINER_COLOR,
  },

  // fontFamily를 비워 OS 기본 서체를 쓴다. 크기는 가이드 최대치(버튼 높이의 1/3)로
  // Apple 시스템 버튼 글자(높이의 약 43%)와 차이를 줄인다
  kakaoLabel: {
    includeFontPadding: false,
    fontSize: SOCIAL_BUTTON_HEIGHT / 3,
    fontWeight: '600',
    lineHeight: (SOCIAL_BUTTON_HEIGHT / 3) * 1.25,
    color: KAKAO_LABEL_COLOR,
  },
});

export default WelcomeScreen;
