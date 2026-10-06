// ── palette: Color Palette의 원시 색상값 (캡스톤 디자인 v2.0) ─────────
export const palette = {
  neutral: {
    0: '#ffffff', 50: '#f5f7f9', 100: '#f1f2f4', 200: '#dddfe3',
    300: '#cbced2', 400: '#b4b8bc', 500: '#a0a3a7', 600: '#888b8f',
    700: '#6c6f73', 800: '#505357', 900: '#33373b', 1000: '#17191c',
    alpha: '#22314a',
  },
  blue: {
    100: '#e7efff', 200: '#ccdeff', 300: '#adc9ff', 400: '#91b6ff',
    500: '#70a0ff', 600: '#508afd', 700: '#2b6dfd', 800: '#1d52d7',
    900: '#143894', 1000: '#0a1a47',
  },
  red: {
    100: '#ffe7e7', 200: '#fed1d1', 300: '#fdb5b5', 400: '#ff9494',
    500: '#ff6b6b', 600: '#f84444', 700: '#e70d0d', 800: '#ba0808',
    900: '#860303', 1000: '#460101',
  },
  pink: {
    100: '#ffe8ef', 200: '#fdd0dd', 300: '#fcb1c6', 400: '#f994b1',
    500: '#fb6f97', 600: '#f8497b', 700: '#df2056', 800: '#b80a3b',
    900: '#810427', 1000: '#450215',
  },
  green: {
    100: '#e3f7eb', 200: '#b6f1cd', 300: '#8ce3b2', 400: '#60d299',
    500: '#36bf81', 600: '#10ad6e', 700: '#009459', 800: '#027446',
    900: '#094e31', 1000: '#062315',
  },
  yellow: {
    100: '#fcf0ce', 200: '#f6dc95', 300: '#fbc532', 400: '#f0ab0a',
    500: '#e09600', 600: '#cf8002', 700: '#b16706', 800: '#934f06',
    900: '#6b3606', 1000: '#331702',
  },
};

// ── shadow: elevation effect style → RN 호환 props로 변환 ─────────
// elevation/middleDown: Drop shadow, X0 Y4, Blur 15, Spread 0,
// color=overlay/weak (neutral/1000 #17191c @ 20% → shadowColor + shadowOpacity로 분리)
export const shadow = {
  // elevation/weakDown: Drop shadow, X0 Y4, Blur 15, Spread 0, color=overlay @ 10%
  weakDown: {
    shadowColor: '#17191c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 3, // Android
  },

  middleDown: {
    shadowColor: '#17191c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 4, // Android
  },

  middleUp: {
    shadowColor: palette.neutral[1000],
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 4,
  },
};

// ── colors: Color System의 시맨틱 토큰, palette 참조를 실제 값으로 resolve ──
// 투명도가 있는 토큰은 '#rrggbb' + 알파 hex로 표현 (8% → 14, 13% → 21, 25% → 40, 50% → 80, 75% → bf)
export const colors = {
  // ── bg ──
  bgLayerBase: palette.neutral[100],
  bgLayerBase0: `${palette.neutral[100]}00`,
  bgSurface: palette.neutral[0],
  bgSurface0: `${palette.neutral[0]}00`,
  bgNeutralInverted: palette.neutral[900],
  bgDimmedStrong: '#000000bf',
  bgDimmed: '#00000080',
  bgDimmedWeak: '#00000040',

  // ── fill ──
  fillNeutral: palette.neutral[1000],
  fillNeutralPress: palette.neutral[900],
  fillNeutralWeak: `${palette.neutral.alpha}14`,
  fillNeutralWeakPress: `${palette.neutral.alpha}21`,
  fillSurface: palette.neutral[0],
  fillSurfacePress: palette.neutral[100],
  fillInfo: palette.blue[700],
  fillInfoPress: palette.blue[800],
  fillInfoWeak: palette.blue[100],
  fillInfoWeakPress: palette.blue[200],
  fillPositive: palette.green[600],
  fillPositivePress: palette.green[700],
  fillPositiveWeak: palette.green[100],
  fillPositiveWeakPress: palette.green[200],
  fillCritical: palette.red[600],
  fillCriticalPress: palette.red[700],
  fillCriticalWeak: palette.red[100],
  fillCriticalWeakPress: palette.red[200],
  fillWarning: palette.yellow[700],
  fillWarningPress: palette.yellow[800],
  fillWarningWeak: palette.yellow[100],
  fillWarningWeakPress: palette.yellow[200],

  // ── stroke ──
  strokeNeutralPrimary: palette.neutral[1000],
  strokeNeutralSecondary: palette.neutral[600],
  strokeNeutralTertiary: palette.neutral[300],
  strokeNeutralQuaternary: palette.neutral[200],
  strokeInfo: palette.blue[700],
  strokePositive: palette.green[800],
  strokeCritical: palette.red[700],
  strokeWarning: palette.yellow[700],
  strokeFocusRing: palette.blue[500],

  // ── fg ──
  fgNeutralPrimary: palette.neutral[1000],
  fgNeutralSecondary: palette.neutral[800],
  fgNeutralTertiary: palette.neutral[600],
  fgNeutralQuaternary: palette.neutral[500],
  fgDisabled: palette.neutral[400],
  fgNeutralInverted: palette.neutral[0],
  fgInfo: palette.blue[700],
  fgInfoInverted: palette.blue[400],
  fgPositive: palette.green[700],
  fgPositiveInverted: palette.green[300],
  fgCritical: palette.red[700],
  fgCriticalInverted: palette.red[500],
  fgWarning: palette.yellow[700],
  fgWarningInverted: palette.yellow[300],
  fgLikeActive: palette.pink[500],
  fgBookmarkActive: palette.blue[500],
};

// '#rrggbb' 또는 '#rrggbbaa' 색을 같은 색의 완전 투명(알파 00)으로 바꾼다.
// 그라데이션이 투명에서 이 색으로 자연스럽게 이어지게 할 때 쓴다 ('transparent' 는 검정 투명이라 중간이 탁해진다)
export const toTransparent = color => `${color.slice(0, 7)}00`;
