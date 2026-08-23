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
  // title: lineHeight 150%
  suitTitleXLargeStrong:  { ...base, fontFamily: fontFamily.suitBold,     fontSize: 24, lineHeight: 36,    letterSpacing: 0 },
  suitTitleLarge:         { ...base, fontFamily: fontFamily.suitMedium,   fontSize: 20, lineHeight: 30,    letterSpacing: 0 },
  suitTitleMediumStrong:  { ...base, fontFamily: fontFamily.suitBold,     fontSize: 18, lineHeight: 27,    letterSpacing: 0 },
  suitTitleMedium:        { ...base, fontFamily: fontFamily.suitMedium,   fontSize: 18, lineHeight: 27,    letterSpacing: 0 },
  suitTitleSmallStrong:   { ...base, fontFamily: fontFamily.suitBold,     fontSize: 14, lineHeight: 21,    letterSpacing: 0 },
  suitTitleSmall:         { ...base, fontFamily: fontFamily.suitMedium,   fontSize: 14, lineHeight: 21,    letterSpacing: 0 },
  // body: lineHeight 150%
  suitBodyXLarge:         { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 17, lineHeight: 25.5,  letterSpacing: 0 },
  suitBodyLarge:          { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 16, lineHeight: 24,    letterSpacing: 0 },
  suitBodyMedium:         { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 14, lineHeight: 21,    letterSpacing: 0 },
  suitBodySmall:          { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 13, lineHeight: 19.5,  letterSpacing: 0 },
  // label: lineHeight 125%
  suitLabelXXLargeStrong: { ...base, fontFamily: fontFamily.suitSemiBold, fontSize: 17, lineHeight: 21.25, letterSpacing: 0 },
  suitLabelXLargeStrong:  { ...base, fontFamily: fontFamily.suitSemiBold, fontSize: 16, lineHeight: 20,    letterSpacing: 0 },
  suitLabelXLarge:        { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 16, lineHeight: 20,    letterSpacing: 0 },
  suitLabelLargeStrong:   { ...base, fontFamily: fontFamily.suitSemiBold, fontSize: 15, lineHeight: 18.75, letterSpacing: 0 },
  suitLabelLarge:         { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 15, lineHeight: 18.75, letterSpacing: 0 },
  suitLabelMedium:        { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 13, lineHeight: 16.25, letterSpacing: 0 },
  suitLabelMediumStrong:  { ...base, fontFamily: fontFamily.suitSemiBold, fontSize: 13, lineHeight: 16.25, letterSpacing: 0 },


  // ── Kyobo Handwriting 2025 (본문 손글씨) ──────────────────────
  // title: lineHeight 150%
  kyoboTitleLarge:   { ...base, fontFamily: fontFamily.kyobo, fontSize: 24, lineHeight: 36,    letterSpacing: 0 },
  kyoboTitleMedium:  { ...base, fontFamily: fontFamily.kyobo, fontSize: 20, lineHeight: 30,    letterSpacing: 0 },
  kyoboTitleSmall:   { ...base, fontFamily: fontFamily.kyobo, fontSize: 18, lineHeight: 27,    letterSpacing: 0 },
  // body: lineHeight 150%
  kyoboBodyXLarge:   { ...base, fontFamily: fontFamily.kyobo, fontSize: 19, lineHeight: 28.5,  letterSpacing: 0 },
  kyoboBodyLarge:    { ...base, fontFamily: fontFamily.kyobo, fontSize: 18, lineHeight: 27,    letterSpacing: 0 },
  kyoboBodyMedium:   { ...base, fontFamily: fontFamily.kyobo, fontSize: 16, lineHeight: 24,    letterSpacing: 0 },
  kyoboBodySmall:    { ...base, fontFamily: fontFamily.kyobo, fontSize: 14, lineHeight: 21,    letterSpacing: 0 },
  // label: lineHeight 125%
  kyoboLabelXLarge:  { ...base, fontFamily: fontFamily.kyobo, fontSize: 19, lineHeight: 23.75, letterSpacing: 0 },
  kyoboLabelLarge:   { ...base, fontFamily: fontFamily.kyobo, fontSize: 17, lineHeight: 21.25, letterSpacing: 0 },
  kyoboLabelMedium:  { ...base, fontFamily: fontFamily.kyobo, fontSize: 15, lineHeight: 18.75, letterSpacing: 0 },
  kyoboLabelSmall:   { ...base, fontFamily: fontFamily.kyobo, fontSize: 13, lineHeight: 16.25, letterSpacing: 0 },
};
