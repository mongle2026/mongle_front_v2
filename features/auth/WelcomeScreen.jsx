import { Platform, StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';

import logoSignitureMotion from '../../assets/logo/logo_signiture_motion.json';
import IcKakao from '../../assets/icons/ic_kakao.svg';
import IcApple from '../../assets/icons/ic_apple.svg';

import { useGlobalOverlay } from '../../shared/providers/GlobalOverlayProvider';
import { getApiErrorMessage } from '../../shared/api/client';
import useKakaoLogin from './hooks/useKakaoLogin';
import useAppleLogin from './hooks/useAppleLogin';

import { colors } from '../../shared/styles/color';
import { typo } from '../../shared/styles/typo';
import { gap, padding, radius } from '../../shared/styles/token';

// 로고 원본 비율(120 × 64)을 유지한 채 너비만 키운다
const LOGO_WIDTH = 160;
const LOGO_HEIGHT = (LOGO_WIDTH * 64) / 120;

// 카카오 · Apple 버튼 높이를 맞춘다. 모서리는 둘 다 radius.XL (카카오 가이드 12)
const SOCIAL_BUTTON_HEIGHT = 54;

const KAKAO_SYMBOL_SIZE = 18;
const KAKAO_PADDING_X = 15;

// Apple 가이드상 버튼 테두리(stroke)는 바꿀 수 있다
const APPLE_BORDER_WIDTH = 1;

// Apple 가이드의 제목 크기 "높이의 43%"(23)보다 작게 둔다. 실제 시스템 버튼 제목도 43%보다 작다
const APPLE_LABEL_SIZE = 18;

// 왼쪽 정렬 로고(Medium, 원본 31 × 44)는 자르지 않고 높이를 버튼 안쪽 높이에 맞춘다
const APPLE_LOGO_HEIGHT = SOCIAL_BUTTON_HEIGHT - APPLE_BORDER_WIDTH * 2;
const APPLE_LOGO_SCALE = APPLE_LOGO_HEIGHT / 44;
const APPLE_LOGO_WIDTH = 31 * APPLE_LOGO_SCALE;

// 로고 파일 안에서 사과 모양이 차지하는 가로 범위 (원본 좌표)
const APPLE_GLYPH_LEFT = 7.75;
const APPLE_GLYPH_RIGHT = 23.21;

// Apple 가이드상 다른 로그인 로고와 맞추려면 로고를 안쪽으로 옮길 수 있다.
// 사과 모양 가운데를 카카오 심볼 가운데에 맞춘다 (absolute 기준은 테두리 안쪽)
const KAKAO_SYMBOL_CENTER_X = KAKAO_PADDING_X + KAKAO_SYMBOL_SIZE / 2;
const APPLE_LOGO_INSET =
  KAKAO_SYMBOL_CENTER_X -
  APPLE_BORDER_WIDTH -
  ((APPLE_GLYPH_LEFT + APPLE_GLYPH_RIGHT) / 2) * APPLE_LOGO_SCALE;

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
        {/* 화면에 들어올 때 서명 모션을 한 번 재생하고 마지막 프레임에 멈춘다 */}
        <LottieView
          source={logoSignitureMotion}
          autoPlay
          loop={false}
          style={styles.logo}
        />
        <Text style={styles.tagline}>당신의 추억이 음악으로 남는 곳</Text>
      </View>

      <View style={styles.footer}>
        {/* Sign in with Apple은 iOS에서만 제공한다. 왼쪽 정렬 로고는 시스템 버튼에 없어서 Apple 로고 파일로 직접 만든다 */}
        {Platform.OS === 'ios' && (
          <Pressable
            accessibilityRole="button"
            onPress={handleApplePress}
            style={styles.appleButton}
          >
            <IcApple
              width={APPLE_LOGO_WIDTH}
              height={APPLE_LOGO_HEIGHT}
              style={styles.appleLogo}
            />
            <Text style={styles.appleLabel}>Apple로 계속하기</Text>
          </Pressable>
        )}

        {/* 심볼은 왼쪽에 붙이고 레이블은 버튼 가운데에 둔다 */}
        <Pressable
          accessibilityRole="button"
          onPress={handleKakaoPress}
          style={styles.kakaoButton}
        >
          <View style={styles.kakaoSymbol}>
            <IcKakao width={KAKAO_SYMBOL_SIZE} height={KAKAO_SYMBOL_SIZE} />
          </View>
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

  logo: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
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

  // Apple 가이드: 배경 · 로고 · 제목은 흑백만. 좌우 여백은 카카오 버튼과 맞춘다
  appleButton: {
    alignSelf: 'stretch',
    height: SOCIAL_BUTTON_HEIGHT,
    paddingHorizontal: KAKAO_PADDING_X,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: APPLE_BORDER_WIDTH,
    borderColor: '#BFBFBF',
    borderRadius: radius.XL,
    backgroundColor: '#FFFFFF',
    // 로고 파일의 흰 배경이 모서리 테두리를 덮지 않게 자른다
    overflow: 'hidden',
  },

  appleLogo: {
    position: 'absolute',
    top: 0,
    left: APPLE_LOGO_INSET,
  },

  // fontFamily를 비워 시스템 서체를 쓴다
  appleLabel: {
    includeFontPadding: false,
    fontSize: APPLE_LABEL_SIZE,
    fontWeight: '600',
    lineHeight: APPLE_LABEL_SIZE * 1.25,
    color: '#000000',
  },

  // 카카오 로그인 디자인 가이드: 컨테이너 #FEE500, 심볼 #000000, 레이블 #000000 85% + OS 기본 서체
  kakaoButton: {
    alignSelf: 'stretch',
    height: SOCIAL_BUTTON_HEIGHT,
    paddingHorizontal: KAKAO_PADDING_X,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.XL,
    backgroundColor: '#FEE500',
  },

  kakaoSymbol: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: KAKAO_PADDING_X,
    justifyContent: 'center',
  },

  // fontFamily를 비워 OS 기본 서체를 쓴다. 크기는 가이드 최대치(버튼 높이의 1/3)로
  // Apple 버튼 제목과 차이를 줄인다
  kakaoLabel: {
    includeFontPadding: false,
    fontSize: SOCIAL_BUTTON_HEIGHT / 3,
    fontWeight: '600',
    lineHeight: (SOCIAL_BUTTON_HEIGHT / 3) * 1.25,
    color: 'rgba(0, 0, 0, 0.85)',
  },
});

export default WelcomeScreen;
