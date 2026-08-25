// ── palette: Color Palette의 원시 색상값 (캡스톤 디자인 v2.0) ─────────
export const palette = {
  neutral: {
    0: '#ffffff', 50: '#f6f6f7', 100: '#f1f2f4', 200: '#e5e6e8',
    300: '#d7d9dc', 400: '#c4c6ca', 500: '#a9acb0', 600: '#888c91',
    700: '#72757b', 800: '#3a3d42', 900: '#24272b', 950: '#1e2125',
  },
  blue: {
    50: '#e2e9fe', 100: '#c5d3fd', 200: '#a5bbfe', 300: '#85a4fe',
    400: '#658cfe', 500: '#4574ff', 600: '#2257f4', 700: '#003ae9',
    800: '#002db1', 900: '#002078', 1000: '#001340',
  },
  pink: {
    50: '#fff1f6', 100: '#ffe3eb', 200: '#fec9d8', 300: '#feaec4',
    400: '#fd94b1', 500: '#e47e9b', 600: '#cb6885', 700: '#b25270',
    800: '#983c5a', 900: '#7f2644', 1000: '#66102e',
  },
  red: {
    50: '#fff1f1', 100: '#ffe1e1', 200: '#ffc7c7', 300: '#ffa3a3',
    400: '#ff6b6b', 500: '#ff3636', 600: '#f51f1f', 700: '#d40d0d',
    800: '#ac0f0f', 900: '#8a1212', 1000: '#4a0707',
  },
  green: {
    50: '#f0fffa', 100: '#dffff5', 200: '#c0ffec', 300: '#a8ffe3',
    400: '#9dffdd', 500: '#89ffdb', 600: '#4dffc9', 700: '#14f5ae',
    800: '#0fcb93', 900: '#0f9270', 1000: '#0a4c3a',
  },
  yellow: {
    50: '#fffbeb', 100: '#fff1c2', 200: '#ffdd7e', 300: '#ffc939',
    400: '#fab81c', 500: '#f5a800', 600: '#c08600', 700: '#8a6300',
    800: '#6a4c00', 900: '#4a3400', 1000: '#2e2000',
  },
  overlay: {
    weak: '#1e212533', // neutral/950 @ 20%
    default: '#1e212580', // neutral/950 @ 50%
    strong: '#1e2125bf', // neutral/950 @ 75%
  },
};

// ── shadow: elevation effect style → RN 호환 props로 변환 ─────────
// elevation/middleDown: Drop shadow, X0 Y4, Blur 15, Spread 0,
// color=overlay/weak (neutral/950 #1e2125 @ 20% → shadowColor + shadowOpacity로 분리)
export const shadow = {
  middleDown: {
    shadowColor: '#1e2125',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 4, // Android
  },

  middleUp: {
    shadowColor: palette.neutral[950],
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 4,
  },
};

// ── colors: Color System의 시맨틱 토큰, palette 참조를 실제 값으로 resolve ──
export const colors = {
  // ── background ──
  bgLayerBasement: palette.neutral[100],
  bgLayerCanvas: palette.neutral[50],
  bgLayerDefault: palette.neutral[0],
  bgLayerDefaultPressed: palette.neutral[100],
  bgNeutralSolid: palette.neutral[950],
  bgNeutralFaint: palette.neutral[100],
  bgNeutralFaintPressed: palette.neutral[200],
  bgNeutralInverted: palette.neutral[900],
  bgNeutralInvertedPressed: palette.neutral[800],
  bgDisabled: palette.neutral[200],
  bgCriticalSolid: palette.red[400],
  bgCriticalSolidPressed: palette.red[500],
  bgPositiveSolid: palette.green[400],
  bgPositiveSolidPressed: palette.green[500],
  bgWarningSolid: palette.yellow[300],
  bgWarningSolidPressed: palette.yellow[400],
  bgInfoSolid: palette.blue[500],
  bgInfoSolidPressed: palette.blue[600],
  bgInfoWeak: palette.blue[50],
  bgInfoWeakPressed: palette.blue[100],
  bgOverlay: palette.overlay.strong,
  bgOverlayMuted: palette.overlay.default,

  // ── stroke ──
  strokeNeutralMuted: palette.neutral[800],
  strokeNeutralSolid: palette.neutral[950],
  strokeNeutralWeak: palette.neutral[300],
  strokeNeutralFaint: palette.neutral[200],
  strokeNeutralSubtle: palette.neutral[400],
  strokeCriticalSolid: palette.red[700],
  strokeCriticalWeak: palette.red[300],
  strokePositiveSolid: palette.green[700],
  strokePositiveWeak: palette.green[300],
  strokeWarningSolid: palette.yellow[700],
  strokeWarningWeak: palette.yellow[300],
  strokeInformativeSolid: palette.blue[700],
  strokeInformativeWeak: palette.blue[200],
  strokeFocusRing: palette.blue[500],

  // ── foreground ──
  fgNeutralSolid: palette.neutral[950],
  fgNeutralMuted: palette.neutral[800],
  fgNeutralSubtle: palette.neutral[700],
  fgNeutralWeak: palette.neutral[500],
  fgNeutralFaint: palette.neutral[300],
  fgNeutralInverted: palette.neutral[0],
  fgDisabled: palette.neutral[500],
  fgPlaceholder: palette.neutral[600],
  fgCritical: palette.red[500],
  fgCriticalContrast: palette.red[700],
  fgPositive: palette.green[500],
  fgPositiveContrast: palette.green[700],
  fgWarning: palette.yellow[700],
  fgWarningContrast: palette.yellow[900],
  fgInformative: palette.blue[500],
  fgInformativeContrast: palette.blue[700],
  fgLike: palette.pink[400],
  fgBookmark: palette.blue[300],
};
