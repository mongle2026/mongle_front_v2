// 편지함 우표 탭(우표함 메인)에서 쓰는 우표 PNG.
// 우표함은 탭에 들어갈 때마다 우표 전체를 새로 그려서, SVG 로 그리면 느리다.
// scripts/generate-stamp-pngs.mjs 로 미리 뽑아 둔 PNG 를 쓴다. 우표함 메인 외의 화면은 계속 SVG(envelopeData STAMPS)를 쓴다.
// 키는 envelopeData STAMPS[].id 와 같다. 우표를 추가하면 스크립트를 다시 돌리고 컬러 · 회색에 한 줄씩 추가한다.
// 여기에 없는 우표는 StampBoxItem 에서 예전처럼 SVG 로 그린다.

// 받은 우표
export const STAMP_COLOR_IMAGES = {
  s1: require('../../assets/envelope/stamps/color/stamp_1.png'),
  s2: require('../../assets/envelope/stamps/color/stamp_2.png'),
  s3: require('../../assets/envelope/stamps/color/stamp_3.png'),
  s4: require('../../assets/envelope/stamps/color/stamp_4.png'),
  s5: require('../../assets/envelope/stamps/color/stamp_5.png'),
  s6: require('../../assets/envelope/stamps/color/stamp_6.png'),
  s7: require('../../assets/envelope/stamps/color/stamp_7.png'),
  s8: require('../../assets/envelope/stamps/color/stamp_8.png'),
  s9: require('../../assets/envelope/stamps/color/stamp_9.png'),
  s10: require('../../assets/envelope/stamps/color/stamp_10.png'),
  s11: require('../../assets/envelope/stamps/color/stamp_11.png'),
  s12: require('../../assets/envelope/stamps/color/stamp_12.png'),
  s13: require('../../assets/envelope/stamps/color/stamp_13.png'),
  s14: require('../../assets/envelope/stamps/color/stamp_14.png'),
  s15: require('../../assets/envelope/stamps/color/stamp_15.png'),
  s16: require('../../assets/envelope/stamps/color/stamp_16.png'),
  s17: require('../../assets/envelope/stamps/color/stamp_17.png'),
  s18: require('../../assets/envelope/stamps/color/stamp_18.png'),
  s19: require('../../assets/envelope/stamps/color/stamp_19.png'),
  s20: require('../../assets/envelope/stamps/color/stamp_20.png'),
  s21: require('../../assets/envelope/stamps/color/stamp_21.png'),
  s22: require('../../assets/envelope/stamps/color/stamp_22.png'),
  s23: require('../../assets/envelope/stamps/color/stamp_23.png'),
  s24: require('../../assets/envelope/stamps/color/stamp_24.png'),
  s25: require('../../assets/envelope/stamps/color/stamp_25.png'),
  s26: require('../../assets/envelope/stamps/color/stamp_26.png'),
};

// 받지 않은 우표 (흑백 + 블러로 그림을 알아볼 수 없게 한 회색)
export const STAMP_GRAY_IMAGES = {
  s1: require('../../assets/envelope/stamps/gray/stamp_1.png'),
  s2: require('../../assets/envelope/stamps/gray/stamp_2.png'),
  s3: require('../../assets/envelope/stamps/gray/stamp_3.png'),
  s4: require('../../assets/envelope/stamps/gray/stamp_4.png'),
  s5: require('../../assets/envelope/stamps/gray/stamp_5.png'),
  s6: require('../../assets/envelope/stamps/gray/stamp_6.png'),
  s7: require('../../assets/envelope/stamps/gray/stamp_7.png'),
  s8: require('../../assets/envelope/stamps/gray/stamp_8.png'),
  s9: require('../../assets/envelope/stamps/gray/stamp_9.png'),
  s10: require('../../assets/envelope/stamps/gray/stamp_10.png'),
  s11: require('../../assets/envelope/stamps/gray/stamp_11.png'),
  s12: require('../../assets/envelope/stamps/gray/stamp_12.png'),
  s13: require('../../assets/envelope/stamps/gray/stamp_13.png'),
  s14: require('../../assets/envelope/stamps/gray/stamp_14.png'),
  s15: require('../../assets/envelope/stamps/gray/stamp_15.png'),
  s16: require('../../assets/envelope/stamps/gray/stamp_16.png'),
  s17: require('../../assets/envelope/stamps/gray/stamp_17.png'),
  s18: require('../../assets/envelope/stamps/gray/stamp_18.png'),
  s19: require('../../assets/envelope/stamps/gray/stamp_19.png'),
  s20: require('../../assets/envelope/stamps/gray/stamp_20.png'),
  s21: require('../../assets/envelope/stamps/gray/stamp_21.png'),
  s22: require('../../assets/envelope/stamps/gray/stamp_22.png'),
  s23: require('../../assets/envelope/stamps/gray/stamp_23.png'),
  s24: require('../../assets/envelope/stamps/gray/stamp_24.png'),
  s25: require('../../assets/envelope/stamps/gray/stamp_25.png'),
  s26: require('../../assets/envelope/stamps/gray/stamp_26.png'),
};

// 우표 code 로 우표함 PNG 찾기. isCollected 면 컬러, 아니면 회색. 없으면 null
export const findStampBoxImage = (stampCode, isCollected) =>
  (isCollected ? STAMP_COLOR_IMAGES : STAMP_GRAY_IMAGES)[stampCode] ?? null;
