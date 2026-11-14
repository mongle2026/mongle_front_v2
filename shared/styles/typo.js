// 사용 예시
// ...typo.suitBodyMedium400  /  ...typo.kyoboBodyMedium

// Android는 fontWeight로 굵기 구분이 안 돼서 fontFamily로 직접 지정
// 폰트가 SUITX(SUIT 확장판) / Kyobo Handwriting 2025 두 종류라 key에 접두어(suit/kyobo)를 붙임
// SUITX는 Regular(400) / SemiBold(600) / Bold(700) 세 굵기 (Medium 없음)
// 폰트는 빌드할 때 앱에 넣는다 (app.json 의 expo-font 플러그인).
// 앱에 넣은 폰트는 안드로이드는 파일 이름, iOS는 폰트 안의 이름(PostScript)으로 찾아서
// 아래 이름 = 파일 이름(확장자 제외) = 폰트 안의 이름 이어야 한다
const fontFamily = {
  suitRegular:  'SUITX-Regular',  // 400
  suitSemiBold: 'SUITX-SemiBold', // 600
  suitBold:     'SUITX-Bold',     // 700
  kyobo:        'KyoboHandwriting2025lyb', // 손글씨체, 단일 스타일("lyb")
  kiwiMaru:     'KiwiMaru-Light',       // Kyobo에 없는 한자 대체용 (typo 토큰으로는 쓰지 않음)
};

// Kyobo 손글씨 폰트에는 한자가 하나도 없어서(fontTools로 검증), 한자만 Kiwi Maru Light로 대체한다.
export const KYOBO_FONT_FAMILY = fontFamily.kyobo;
export const HAN_FALLBACK_FONT_FAMILY = fontFamily.kiwiMaru;

// includeFontPadding: false → Android 기본 여백 제거 (iOS/Android 크기 통일)
// letterSpacing은 지정하지 않는다. iOS는 letterSpacing: 0도 NSKern 0으로 넘겨 폰트 커닝을 꺼버려서
// Figma보다 자간이 벌어져 보인다(예: WOODZ). 0이 필요하면 생략, 그 외 값만 지정할 것.
const base = { includeFontPadding: false };

export const typo = {
  // ── SUIT (UI 텍스트) ──────────────────────────────────────────
  // 이름 = Figma 텍스트 스타일 이름 (title-large → suitTitleLarge, body-large-600 → suitBodyLarge600)
  // title: Bold(700) 단일 굵기
  suitTitleLarge:        { ...base, fontFamily: fontFamily.suitBold,     fontSize: 24, lineHeight: 34 },
  suitTitleMedium:       { ...base, fontFamily: fontFamily.suitBold,     fontSize: 20, lineHeight: 28 },
  suitTitleSmall:        { ...base, fontFamily: fontFamily.suitBold,     fontSize: 18, lineHeight: 26 },
  // body: SemiBold(600) / Regular(400)
  suitBodyLarge600:      { ...base, fontFamily: fontFamily.suitSemiBold, fontSize: 16, lineHeight: 24 },
  suitBodyLarge400:      { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 16, lineHeight: 24 },
  suitBodyMedium600:     { ...base, fontFamily: fontFamily.suitSemiBold, fontSize: 15, lineHeight: 22 },
  suitBodyMedium400:     { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 15, lineHeight: 22 },
  suitBodySmall600:      { ...base, fontFamily: fontFamily.suitSemiBold, fontSize: 14, lineHeight: 20 },
  suitBodySmall400:      { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 14, lineHeight: 20 },
  // caption: SemiBold(600) / Regular(400)
  suitCaptionMedium600:  { ...base, fontFamily: fontFamily.suitSemiBold, fontSize: 13, lineHeight: 18 },
  suitCaptionMedium400:  { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 13, lineHeight: 18 },
  suitCaptionSmall600:   { ...base, fontFamily: fontFamily.suitSemiBold, fontSize: 12, lineHeight: 16 },
  suitCaptionSmall400:   { ...base, fontFamily: fontFamily.suitRegular,  fontSize: 12, lineHeight: 16 },

  // ── Kyobo Handwriting 2025 (본문 손글씨) ──────────────────────
  // SUIT와 같은 이름 체계. 굵기가 하나뿐이라 600/400 접미어는 없다.
  // 손글씨는 같은 크기에서 더 작아 보여서 body/caption은 SUIT보다 2px 크게 둔다 (title은 동일).
  // lineHeight는 같은 자리 SUIT의 비율을 따라 정수로 반올림
  kyoboTitleLarge:       { ...base, fontFamily: fontFamily.kyobo, fontSize: 24, lineHeight: 34 },
  kyoboTitleMedium:      { ...base, fontFamily: fontFamily.kyobo, fontSize: 20, lineHeight: 28 },
  kyoboTitleSmall:       { ...base, fontFamily: fontFamily.kyobo, fontSize: 18, lineHeight: 26 },
  kyoboBodyLarge:        { ...base, fontFamily: fontFamily.kyobo, fontSize: 18, lineHeight: 27 },
  kyoboBodyMedium:       { ...base, fontFamily: fontFamily.kyobo, fontSize: 17, lineHeight: 25 },
  kyoboBodySmall:        { ...base, fontFamily: fontFamily.kyobo, fontSize: 16, lineHeight: 23 },
  kyoboCaptionMedium:    { ...base, fontFamily: fontFamily.kyobo, fontSize: 15, lineHeight: 21 },
  kyoboCaptionSmall:     { ...base, fontFamily: fontFamily.kyobo, fontSize: 14, lineHeight: 19 },
};
