// 사용 예시
// ...typo.suitBodyMedium  /  ...typo.kyoboBodyMedium

// Android는 fontWeight로 굵기 구분이 안 돼서 fontFamily로 직접 지정
// 폰트가 SUIT / Kyobo Handwriting 2025 두 종류라 key에 접두어(suit/kyobo)를 붙임
// ⚠️ 실제 렌더링에는 폰트 로딩(expo-font)이 별도로 필요 (shared/styles/fonts.js)
const fontFamily = {
  suitRegular:  'SUIT-Regular',
  suitMedium:   'SUIT-Medium',
  suitSemiBold: 'SUIT-SemiBold',
  suitBold:     'SUIT-Bold',
  kyobo:        'KyoboHandwriting2025', // 손글씨체, 단일 스타일("lyb")
};

// includeFontPadding: false → Android 기본 여백 제거 (iOS/Android 크기 통일)
// lineHeight는 Figma의 % 값을 fontSize 기준으로 계산한 결과 (절대값은 그대로)
const base = { includeFontPadding: false };

export const typo = {
  // ── SUIT (UI 텍스트) ──────────────────────────────────────────
  suitTitleXLargeStrong:  { ...base, fontFamily: fontFamily.suitBold,     fontSize: 24, lineHeight: 36,   letterSpacing: 0 },
  suitTitleLarge:         { ...base, fontFamily: fontFamily.suitMedium,   fontSize: 20, lineHeight: 30,   letterSpacing: 0 },
  suitTitleMedium:        { ...base, fontFamily: fontFamily.suitMedium,   fontSize: 17, lineHeight: 25.5, letterSpacing: 0 },
  suitTitleSmallStrong:   { ...base, fontFamily: fontFamily.suitBold,     fontSize: 14, lineHeight: 21,   letterSpacing: 0 },
  suitTitleSmall:         { ...base, fontFamily: fontFamily.suitMedium,   fontSize: 14, lineHeight: 26,   letterSpacing: 0 },
  suitBodyLarge:          { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 14, lineHeight: 21,   letterSpacing: 0 },
  suitLabelLarge:         { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 14, lineHeight: 14,   letterSpacing: 0 },
  suitLabelLargeStrong:   { ...base, fontFamily: fontFamily.suitSemiBold, fontSize: 14, lineHeight: 14,   letterSpacing: 0 },
  suitBodyMedium:         { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 13, lineHeight: 19.5, letterSpacing: 0 },
  suitLabelMedium:        { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 12, lineHeight: 12,   letterSpacing: 0 },
  suitLabelMediumStrong:  { ...base, fontFamily: fontFamily.suitSemiBold, fontSize: 12, lineHeight: 12,   letterSpacing: 0 },
  suitBodySmall:          { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 11, lineHeight: 16.5, letterSpacing: 0 },
  suitCaptionLarge:       { ...base, fontFamily: fontFamily.suitMedium,   fontSize: 10, lineHeight: 15,   letterSpacing: 0 },
  suitCaptionLargeStrong: { ...base, fontFamily: fontFamily.suitBold,     fontSize: 10, lineHeight: 15,   letterSpacing: 0 },

  // ── Kyobo Handwriting 2025 (본문 손글씨) ──────────────────────
  kyoboTitleLarge:   { ...base, fontFamily: fontFamily.kyobo, fontSize: 24, lineHeight: 36,   letterSpacing: 0 },
  kyoboTitleMedium:  { ...base, fontFamily: fontFamily.kyobo, fontSize: 20, lineHeight: 30,   letterSpacing: 0 },
  kyoboTitleSmall:   { ...base, fontFamily: fontFamily.kyobo, fontSize: 18, lineHeight: 27,   letterSpacing: 0 },
  kyoboBodyLarge:    { ...base, fontFamily: fontFamily.kyobo, fontSize: 17, lineHeight: 23.8, letterSpacing: 0 },
  kyoboLabelLarge:   { ...base, fontFamily: fontFamily.kyobo, fontSize: 16, lineHeight: 16,   letterSpacing: 0 },
  kyoboBodyMedium:   { ...base, fontFamily: fontFamily.kyobo, fontSize: 15, lineHeight: 21,   letterSpacing: 0 },
  kyoboLabelMedium:  { ...base, fontFamily: fontFamily.kyobo, fontSize: 14, lineHeight: 14,   letterSpacing: 0 },
  kyoboBodySmall:    { ...base, fontFamily: fontFamily.kyobo, fontSize: 13, lineHeight: 18.2, letterSpacing: 0 },
  kyoboLabelSmall:   { ...base, fontFamily: fontFamily.kyobo, fontSize: 12, lineHeight: 12,   letterSpacing: 0 },
  kyoboCaptionLarge: { ...base, fontFamily: fontFamily.kyobo, fontSize: 12, lineHeight: 18,   letterSpacing: 0 },
  kyoboCaptionSmall: { ...base, fontFamily: fontFamily.kyobo, fontSize: 11, lineHeight: 16.5, letterSpacing: 0 },
};
