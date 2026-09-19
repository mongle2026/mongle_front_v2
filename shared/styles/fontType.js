import { typo } from './typo';

export const FONT = Object.freeze({
  KYOBO: 'kyobo',
  SUIT: 'suit',
});

export const normalizeFont = font => {
  if (typeof font !== 'string') {
    return FONT.KYOBO;
  }

  const normalized = font.toLowerCase();

  return Object.values(FONT).includes(normalized)
    ? normalized
    : FONT.KYOBO;
};

// 기록 / 편지 본문 폰트별 타이포
const BODY_FONT_STYLES = Object.freeze({
  [FONT.KYOBO]: typo.kyoboBodyLarge,
  [FONT.SUIT]: typo.suitBodyLarge,
});

export const getBodyFontStyle = font =>
  BODY_FONT_STYLES[font] ?? BODY_FONT_STYLES[FONT.KYOBO];
