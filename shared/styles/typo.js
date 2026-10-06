// 사용 예시
// ...typo.suitBodyMedium  /  ...typo.kyoboBodyMedium

// Android는 fontWeight로 굵기 구분이 안 돼서 fontFamily로 직접 지정
// 폰트가 SUITX(SUIT 확장판) / Kyobo Handwriting 2025 두 종류라 key에 접두어(suit/kyobo)를 붙임
// SUITX는 Regular(400) / SemiBold(600) / Bold(700) 세 굵기 (Medium 없음)
// ⚠️ 실제 렌더링에는 폰트 로딩(expo-font)이 별도로 필요 (shared/styles/fonts.js)
const fontFamily = {
  suitRegular:  'SUITX-Regular',  // 400
  suitSemiBold: 'SUITX-SemiBold', // 600
  suitBold:     'SUITX-Bold',     // 700
  kyobo:        'KyoboHandwriting2025', // 손글씨체, 단일 스타일("lyb")
  kiwiMaru:     'KiwiMaru-Light',       // Kyobo에 없는 한자 대체용 (typo 토큰으로는 쓰지 않음)
};

// Kyobo 손글씨 폰트에는 한자가 하나도 없어서(fontTools로 검증), 한자만 Kiwi Maru Light로 대체한다.
export const KYOBO_FONT_FAMILY = fontFamily.kyobo;
export const HAN_FALLBACK_FONT_FAMILY = fontFamily.kiwiMaru;

// includeFontPadding: false → Android 기본 여백 제거 (iOS/Android 크기 통일)
// letterSpacing은 지정하지 않는다. iOS는 letterSpacing: 0도 NSKern 0으로 넘겨 폰트 커닝을 꺼버려서
// Figma보다 자간이 벌어져 보인다(예: WOODZ). 0이 필요하면 생략, 그 외 값만 지정할 것.
// lineHeight는 Figma의 % 값을 fontSize 기준으로 계산한 결과 (절대값은 그대로)
const base = { includeFontPadding: false };

export const typo = {
  // ── SUIT (UI 텍스트) ──────────────────────────────────────────
  // title: lineHeight 150%
  suitTitleXLargeStrong:  { ...base, fontFamily: fontFamily.suitBold,     fontSize: 24, lineHeight: 36 },
  suitTitleLarge:         { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 20, lineHeight: 30 },
  suitTitleMediumStrong:  { ...base, fontFamily: fontFamily.suitBold,     fontSize: 18, lineHeight: 27 },
  suitTitleMedium:        { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 18, lineHeight: 27 },
  suitTitleSmallStrong:   { ...base, fontFamily: fontFamily.suitBold,     fontSize: 14, lineHeight: 21 },
  suitTitleSmall:         { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 14, lineHeight: 21 },
  // body: lineHeight 150%
  suitBodyXLarge:         { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 17, lineHeight: 25.5 },
  suitBodyLarge:          { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 16, lineHeight: 24 },
  suitBodyMedium:         { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 14, lineHeight: 21 },
  suitBodySmall:          { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 13, lineHeight: 19.5 },
  // label: lineHeight 125%
  suitLabelXXLargeStrong: { ...base, fontFamily: fontFamily.suitSemiBold, fontSize: 17, lineHeight: 21.25 },
  suitLabelXLargeStrong:  { ...base, fontFamily: fontFamily.suitSemiBold, fontSize: 16, lineHeight: 20 },
  suitLabelXLarge:        { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 16, lineHeight: 20 },
  suitLabelLargeStrong:   { ...base, fontFamily: fontFamily.suitSemiBold, fontSize: 15, lineHeight: 18.75 },
  suitLabelLarge:         { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 15, lineHeight: 18.75 },
  suitLabelMedium:        { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 13, lineHeight: 16.25 },
  suitLabelMediumStrong:  { ...base, fontFamily: fontFamily.suitSemiBold, fontSize: 13, lineHeight: 16.25 },


  // ── Kyobo Handwriting 2025 (본문 손글씨) ──────────────────────
  // title: lineHeight 150%
  kyoboTitleLarge:   { ...base, fontFamily: fontFamily.kyobo, fontSize: 24, lineHeight: 36 },
  kyoboTitleMedium:  { ...base, fontFamily: fontFamily.kyobo, fontSize: 20, lineHeight: 30 },
  kyoboTitleSmall:   { ...base, fontFamily: fontFamily.kyobo, fontSize: 18, lineHeight: 27 },
  // body: lineHeight 150%
  kyoboBodyXLarge:   { ...base, fontFamily: fontFamily.kyobo, fontSize: 19, lineHeight: 26.6 },
  kyoboBodyLarge:    { ...base, fontFamily: fontFamily.kyobo, fontSize: 18, lineHeight: 25.2 },
  kyoboBodyMedium:   { ...base, fontFamily: fontFamily.kyobo, fontSize: 16, lineHeight: 22.4 },
  kyoboBodySmall:    { ...base, fontFamily: fontFamily.kyobo, fontSize: 14, lineHeight: 19.6 },
  // label: lineHeight 125%
  kyoboLabelXLarge:  { ...base, fontFamily: fontFamily.kyobo, fontSize: 19, lineHeight: 23.75 },
  kyoboLabelLarge:   { ...base, fontFamily: fontFamily.kyobo, fontSize: 17, lineHeight: 21.25 },
  kyoboLabelMedium:  { ...base, fontFamily: fontFamily.kyobo, fontSize: 15, lineHeight: 18.75 },
  kyoboLabelSmall:   { ...base, fontFamily: fontFamily.kyobo, fontSize: 13, lineHeight: 16.25 },
};
