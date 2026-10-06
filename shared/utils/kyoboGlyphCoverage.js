// assets/fonts/Kyobo/*.ttf 에는 한자(CJK Unified Ideographs)가 하나도 없다.
// 가나·한글·기본 CJK 문장부호는 있지만, 아래 문장부호들은 빠져 있어
// 한자 대체 폰트 Kiwi Maru(assets/fonts/KiwiMaru)에 있는 것만 골라 함께 대체한다(fontTools로 검증).
// 폰트 파일이 교체되면 이 목록도 다시 확인해야 한다.
const KYOBO_MISSING_CJK_SYMBOLS = new Set('〄々〆〇〒〜〝〟〠〶');

const HAN_RANGES = [
  [0x3400, 0x4dbf], // CJK Unified Ideographs Extension A
  [0x4e00, 0x9fff], // CJK Unified Ideographs
  [0xf900, 0xfaff], // CJK Compatibility Ideographs
];

// Kyobo로 그리면 빈칸/시스템 폰트로 보이는 글자라 Kiwi Maru로 대체해야 하는지 여부.
export const needsKyoboHanFallback = char => {
  if (KYOBO_MISSING_CJK_SYMBOLS.has(char)) return true;

  const code = char.codePointAt(0);

  return HAN_RANGES.some(([start, end]) => code >= start && code <= end);
};
