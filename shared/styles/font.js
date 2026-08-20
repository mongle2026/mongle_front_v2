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