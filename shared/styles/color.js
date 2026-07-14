// ── palette: Color Palette의 원시 색상값 ──────────────────────────
export const palette = {
  mongle: {
    10: '#e0eeff', 20: '#c7dfff', 30: '#99c5ff', 40: '#7ab4ff',
    50: '#4596ff', 60: '#177afd', 70: '#0569eb', 80: '#0653b7',
    90: '#063c84', 100: '#072955',
  },
  red: {
    10: '#ffe0e0', 20: '#ffc2c2', 30: '#ff9999', 40: '#ff8585',
    50: '#fa6361', 60: '#e4130c', 70: '#b00a07', 80: '#890606',
    90: '#550707',
  },
  green: {
    10: '#e0fff3', 20: '#c5fbe7', 30: '#a4f4d5', 40: '#89f2ca',
    50: '#62edb8', 60: '#27e79e', 70: '#0ed88e', 80: '#07b070',
    90: '#077e50', 100: '#075537',
  },
  gray: {
    0: '#ffffff', 10: '#eef0f1', 20: '#e6e8eb', 30: '#d9dbdf',
    40: '#bfc2c7', 50: '#a6adb6', 60: '#8f9399', 70: '#747a81',
    80: '#54595f', 90: '#34373a', 100: '#1a1b1c',
  },
  pink: {
    10: '#ffe0eb', 20: '#ffc2d7', 30: '#ff99bd', 40: '#ff85af',
    50: '#fa6196', 60: '#f42f74', 70: '#e40c57', 80: '#b00742',
    90: '#890634', 100: '#550722',
  },
  yellow: {
    10: '#fff9e7', 20: '#ffebad', 30: '#ffe69b', 40: '#ffdd78',
    50: '#ffd158', 60: '#ffc038', 70: '#f9b137', 80: '#eea338',
    90: '#c17c1a', 100: '#965b13',
  },
  grayOpacity: {
    20: '#1a1b1c33',
    50: '#1a1b1c80',
    75: '#1a1b1cbf',
  },
  whiteOpacity: {
    30: '#ffffff4d',
  },
};

// ── shadow: boxShadow → RN 호환 props로 변환 ─────────────────────
// token.json의 blur(15)를 shadowRadius로, #00000033의 알파(0x33≈0.2)를 shadowOpacity로 분리
export const shadow = {
  middleDown: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 4, // Android
  },
  middleUp: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 4, // Android
  },
};

// ── colors: Color System의 시맨틱 토큰, palette 참조를 실제 값으로 resolve ──
export const colors = {
  bgLayerDefault:    palette.gray[0],
  bgDefault:         palette.gray[100],
  bgLayerWeak:       palette.gray[10],
  bgDefaultWeak:     palette.gray[90],
  bgSurface:         palette.gray[80],
  bgLayerSurface:    palette.gray[20],
  bgDimStrong:       palette.grayOpacity[75],
  bgDim:             palette.grayOpacity[50],
  bgDimWeak:         palette.grayOpacity[20],
  bgBrandSolid:      palette.mongle[50],
  bgCriticalSolid:   palette.red[50],

  strokeNeutralWeak: palette.gray[20],

  fgNeutral:         palette.gray[0],
  fgLayerNeutral:    palette.gray[90],
  fgLayerNeutralWeak:palette.gray[70],
  fgLayerDisabled:   palette.gray[40],
  fgPlaceholder:     palette.gray[60],
  fgBrand:           palette.mongle[50],
  fgCritical:        palette.red[50],
  fgCriticalStrong:  palette.red[60],
  fgPositive:        palette.green[50],
  fgNeutralDisabled: palette.gray[80],
  fgNeutralWeak:     palette.gray[40],
};
