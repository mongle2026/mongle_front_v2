// 사용 예시
// ...typo.bodyMedium

// Android는 fontWeight로 굵기 구분이 안 돼서 fontFamily로 직접 지정
const fontFamily = {
  Regular: 'Pretendard-Regular',
  Medium: 'Pretendard-Medium',
  SemiBold: 'Pretendard-SemiBold',
};

// includeFontPadding: false → Android 기본 여백 제거 (iOS/Android 크기 통일)
// lineHeight, letterSpacing은 token.json의 % 값을 fontSize 기준으로 계산한 결과
const base = { includeFontPadding: false };

export const typo = {
  titleXSmall:      { ...base, fontFamily: fontFamily.Medium,   fontSize: 14, lineHeight: 21,   letterSpacing: -0.14 },
  titleMedium:      { ...base, fontFamily: fontFamily.SemiBold, fontSize: 15, lineHeight: 22.5, letterSpacing: 0     },
  titleXLarge:      { ...base, fontFamily: fontFamily.SemiBold, fontSize: 20, lineHeight: 30,   letterSpacing: -0.2  },
  titleLarge:       { ...base, fontFamily: fontFamily.SemiBold, fontSize: 18, lineHeight: 22.5, letterSpacing: 0     },
  labelMedium:      { ...base, fontFamily: fontFamily.SemiBold, fontSize: 16, lineHeight: 16,   letterSpacing: 0     },
  labelSmall:       { ...base, fontFamily: fontFamily.SemiBold, fontSize: 14, lineHeight: 14,   letterSpacing: 0     },
  bodySmall:        { ...base, fontFamily: fontFamily.Regular,  fontSize: 14, lineHeight: 21,   letterSpacing: -0.14 },
  bodyMedium:       { ...base, fontFamily: fontFamily.Regular,  fontSize: 15, lineHeight: 22.5, letterSpacing: -0.15 },
  bodyMediumStrong: { ...base, fontFamily: fontFamily.SemiBold, fontSize: 15, lineHeight: 22.5, letterSpacing: 0     },
  bodyLarge:        { ...base, fontFamily: fontFamily.Regular,  fontSize: 16, lineHeight: 24,   letterSpacing: -0.16 },
  captionSmall:     { ...base, fontFamily: fontFamily.Medium,   fontSize: 12, lineHeight: 16.2, letterSpacing: 0     },
  captionMedium:    { ...base, fontFamily: fontFamily.Medium,   fontSize: 13, lineHeight: 17.55,letterSpacing: 0     },
};
