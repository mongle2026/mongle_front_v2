import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Canvas, Mask, Path } from '@shopify/react-native-skia';

import LogoDot from '../../assets/logo/logo_splash_dot.svg';
import LogoWordmark from '../../assets/logo/logo_wordmark_ko.svg';

import { colors, palette } from '../../shared/styles/color';
import { typo } from '../../shared/styles/typo';
import { gap } from '../../shared/styles/token';

import { MARK_DRAW_PATH, MARK_DRAW_STROKE_WIDTH, MARK_PATH } from './splashMarkPaths';

// 심볼(m.) 원본 크기 113 × 51, 워드마크(몽글) 원본 크기 71 × 38
const SYMBOL_WIDTH = 113;
const SYMBOL_HEIGHT = 51;
const WORDMARK_WIDTH = 71;
const WORDMARK_HEIGHT = 38;

// 점(.)의 중심을 기준으로 튀어 오르게 한다 (심볼을 원본 크기로 그려서 viewBox 좌표 91.19, 32.03 이 곧 px 위치).
// 소수점이 긴 % 문자열은 RN 이 잘못 읽어서 [x, y, z] 숫자 배열로 넘긴다
const DOT_TRANSFORM_ORIGIN = [91.19, 32.03, 0];

// 네이티브 스플래시(app.json expo-splash-screen backgroundColor)와 같은 색이라 넘어갈 때 티가 나지 않는다
export const SPLASH_DARK_BACKGROUND = palette.neutral[1000];

/*
 * 타임라인 (ms)
 * 100   어두운 배경에 m 을 쓰는 순서대로 붓으로 그려 나간다
 * 1250  다 그린 뒤 점(.)이 톡 찍힌다
 * 2300  m. 이 사라지면서 배경이 흰색으로 바뀐다
 * 2700  워드마크(몽글) → 문구 순서로 떠오른다
 * 4100  여기까지 보여 준 뒤, 시작 준비가 끝났으면 스플래시 전체를 걷어 낸다
 */
const EASE_OUT = Easing.out(Easing.cubic);
const EASE_IN_OUT = Easing.inOut(Easing.cubic);

// 붓질: 천천히 시작해서 가운데에서 빨라지고 끝에서 다시 느려진다
const MARK_DRAW_DELAY = 100;
const MARK_DRAW = { duration: 1200, easing: Easing.bezier(0.65, 0, 0.35, 1) };
const DOT_DELAY = 1250;
const DOT_SPRING = { damping: 10, stiffness: 160, mass: 0.7 };

const SWITCH_AT = 2300;
const SYMBOL_OUT = { duration: 400, easing: Easing.in(Easing.quad) };
const BACKGROUND_SWITCH = { duration: 700, easing: EASE_IN_OUT };

const WORDMARK_AT = 2700;
const TAGLINE_AT = 2950;
const TEXT_IN = { duration: 700, easing: EASE_OUT };

const INTRO_DURATION = 4100;
const SPLASH_OUT = { duration: 450, easing: Easing.out(Easing.quad) };

const RISE_DISTANCE = 8;

/*
 * 앱을 새로 켤 때마다 보여 주는 스플래시. 앱 화면 위에 덮여 있다가
 * 인트로 모션이 끝나고 isReady(저장된 로그인 · 온보딩 정보 복원)가 되면 사라지며 onFinish 를 부른다
 */
const AppSplash = ({ isReady, onFinish }) => {
  const [isIntroDone, setIsIntroDone] = useState(false);
  // 어두운 배경일 때는 밝은 상태바, 흰 배경으로 바뀌면 어두운 상태바
  const [isLightPhase, setIsLightPhase] = useState(false);

  // 0 이면 아무것도 안 그려졌고, 1 이면 m 이 끝까지 그려진 상태
  const markDrawProgress = useSharedValue(0);
  const dotScale = useSharedValue(0);
  const symbolOpacity = useSharedValue(1);
  const lightBackground = useSharedValue(0);
  const wordmarkProgress = useSharedValue(0);
  const taglineProgress = useSharedValue(0);
  const splashOpacity = useSharedValue(1);

  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    markDrawProgress.value = withDelay(MARK_DRAW_DELAY, withTiming(1, MARK_DRAW));
    dotScale.value = withDelay(DOT_DELAY, withSpring(1, DOT_SPRING));
    symbolOpacity.value = withDelay(SWITCH_AT, withTiming(0, SYMBOL_OUT));
    lightBackground.value = withDelay(SWITCH_AT, withTiming(1, BACKGROUND_SWITCH));
    wordmarkProgress.value = withDelay(WORDMARK_AT, withTiming(1, TEXT_IN));
    taglineProgress.value = withDelay(TAGLINE_AT, withTiming(1, TEXT_IN));

    const statusBarTimer = setTimeout(() => setIsLightPhase(true), SWITCH_AT + 250);
    const introTimer = setTimeout(() => setIsIntroDone(true), INTRO_DURATION);

    return () => {
      clearTimeout(statusBarTimer);
      clearTimeout(introTimer);
    };
  }, [
    markDrawProgress,
    dotScale,
    symbolOpacity,
    lightBackground,
    wordmarkProgress,
    taglineProgress,
  ]);

  useEffect(() => {
    if (!isIntroDone || !isReady) return;

    const finish = () => onFinishRef.current?.();
    splashOpacity.value = withTiming(0, SPLASH_OUT, finished => {
      if (finished) scheduleOnRN(finish);
    });
  }, [isIntroDone, isReady, splashOpacity]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
  }));

  const lightBackgroundStyle = useAnimatedStyle(() => ({
    opacity: lightBackground.value,
  }));

  // 흰 화면으로 넘어갈 때 살짝 작아지며 사라진다
  const symbolStyle = useAnimatedStyle(() => ({
    opacity: symbolOpacity.value,
    transform: [{ scale: 0.96 + symbolOpacity.value * 0.04 }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkProgress.value,
    transform: [{ translateY: (1 - wordmarkProgress.value) * RISE_DISTANCE }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineProgress.value,
    transform: [{ translateY: (1 - taglineProgress.value) * RISE_DISTANCE }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.container, containerStyle]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.lightBackground, lightBackgroundStyle]} />

      {/* 어두운 화면: m. */}
      <Animated.View style={[styles.symbol, symbolStyle]}>
        {/* 가운데 선을 굵게 따라 그린 만큼만 m 이 보인다 */}
        <Canvas style={styles.markCanvas}>
          <Mask
            mask={(
              <Path
                path={MARK_DRAW_PATH}
                style="stroke"
                strokeWidth={MARK_DRAW_STROKE_WIDTH}
                strokeCap="round"
                strokeJoin="round"
                color="white"
                start={0}
                end={markDrawProgress}
              />
            )}
          >
            <Path path={MARK_PATH} color="white" />
          </Mask>
        </Canvas>
        <Animated.View style={[StyleSheet.absoluteFill, styles.dot, dotStyle]}>
          <LogoDot width={SYMBOL_WIDTH} height={SYMBOL_HEIGHT} />
        </Animated.View>
      </Animated.View>

      {/* 흰 화면: 몽글 + 문구 */}
      <View style={styles.brand}>
        <Animated.View style={wordmarkStyle}>
          <LogoWordmark width={WORDMARK_WIDTH} height={WORDMARK_HEIGHT} />
        </Animated.View>
        <Animated.Text style={[styles.tagline, taglineStyle]}>
          당신의 추억이 음악으로 남는 곳
        </Animated.Text>
      </View>

      <StatusBar style={isLightPhase ? 'dark' : 'light'} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SPLASH_DARK_BACKGROUND,
  },
  lightBackground: {
    backgroundColor: colors.bgSurface,
  },
  symbol: {
    position: 'absolute',
    width: SYMBOL_WIDTH,
    height: SYMBOL_HEIGHT,
  },
  markCanvas: {
    width: SYMBOL_WIDTH,
    height: SYMBOL_HEIGHT,
  },
  dot: {
    transformOrigin: DOT_TRANSFORM_ORIGIN,
  },
  brand: {
    position: 'absolute',
    alignItems: 'center',
    gap: gap.L,
  },
  tagline: {
    ...typo.suitBodySmall400,
    color: colors.fgNeutralPrimary,
    textAlign: 'center',
  },
});

export default AppSplash;
