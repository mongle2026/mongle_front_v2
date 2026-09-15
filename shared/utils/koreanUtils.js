const HANGUL_SYLLABLE_START = 0xac00;
const HANGUL_SYLLABLE_END = 0xd7a3;
const JONGSEONG_COUNT = 28;

/* 마지막 글자가 받침 있는 한글 음절인지 */
export const hasFinalConsonant = text => {
  const lastChar = String(text ?? '').trim().slice(-1);
  const code = lastChar.charCodeAt(0);

  if (!(code >= HANGUL_SYLLABLE_START && code <= HANGUL_SYLLABLE_END)) return false;

  return (code - HANGUL_SYLLABLE_START) % JONGSEONG_COUNT !== 0;
};

/* 보낸 사람 이름 뒤에 붙는 말. 받침 있는 한글이면 '이가', 나머지는 '가' (예: 지훈이가, 민수가, John가) */
export const getSenderSuffix = name => (hasFinalConsonant(name) ? '이가' : '가');
