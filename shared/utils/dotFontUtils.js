// 3줄 도트 폰트.
// 읽지 않은 편지 카드에서 제목/가수를 dot 격자로 가려 보여줄 때 사용한다.
// 정확히 읽히는 것이 목적이 아니라 "글자가 있다"는 느낌만 주는 용도라, 글자 모양은 근사치다.
//
// 표기 규칙
// - 글리프는 3줄짜리 문자열 배열로 정의한다. '#' = 칠하는 dot, '.' = 기본색 dot.
// - 열 단위로 변환해 비트마스크로 다룬다. bit0 = 첫째 줄, bit1 = 둘째 줄, bit2 = 셋째 줄.

export const DOT_ROWS = 3;

// 영문 대문자. 3줄 안에 담아야 해서 M, W 만 5칸이고 나머지는 3칸이다.
const UPPERCASE_GLYPHS = {
  A: ['###', '#.#', '#.#'],
  B: ['##.', '###', '###'],
  C: ['###', '#..', '###'],
  D: ['##.', '#.#', '##.'],
  E: ['###', '##.', '###'],
  F: ['###', '##.', '#..'],
  G: ['###', '#.#', '.##'],
  H: ['#.#', '###', '#.#'],
  I: ['#', '#', '#'],
  J: ['..#', '..#', '##.'],
  K: ['#.#', '##.', '#.#'],
  L: ['#..', '#..', '###'],
  M: ['##.##', '#.#.#', '#...#'],
  N: ['##.', '#.#', '.##'],
  O: ['###', '#.#', '###'],
  P: ['###', '###', '#..'],
  Q: ['###', '#.#', '##.'],
  R: ['###', '##.', '#.#'],
  S: ['###', '.#.', '###'],
  T: ['###', '.#.', '.#.'],
  U: ['#.#', '#.#', '###'],
  V: ['#.#', '#.#', '.#.'],
  W: ['#...#', '#.#.#', '.#.#.'],
  X: ['#.#', '.#.', '#.#'],
  Y: ['#.#', '.#.', '.#.'],
  Z: ['###', '..#', '###'],
};

// 영문 소문자. 대문자와 밀도가 달라 보이도록 아래 두 줄을 주로 쓰고,
// 위 줄은 b/d/f/h/k/l/t 처럼 기둥이 올라오는 글자에만 쓴다.
const LOWERCASE_GLYPHS = {
  a: ['...', '.##', '###'],
  b: ['#..', '##.', '###'],
  c: ['...', '###', '##.'],
  d: ['..#', '.##', '###'],
  e: ['...', '###', '#.#'],
  f: ['.##', '###', '.#.'],
  g: ['...', '###', '..#'],
  h: ['#..', '##.', '#.#'],
  i: ['#', '#', '#'],
  j: ['..#', '..#', '##.'],
  k: ['#..', '#.#', '##.'],
  l: ['#', '#', '#'],
  m: ['.....', '#####', '#.#.#'],
  n: ['...', '###', '#.#'],
  o: ['...', '###', '###'],
  p: ['...', '###', '##.'],
  q: ['...', '###', '.##'],
  r: ['...', '###', '#..'],
  s: ['...', '.##', '##.'],
  t: ['.#.', '###', '.##'],
  u: ['...', '#.#', '###'],
  v: ['...', '#.#', '.#.'],
  w: ['.....', '#.#.#', '.#.#.'],
  x: ['...', '#.#', '#.#'],
  y: ['...', '#.#', '.##'],
  z: ['...', '###', '.#.'],
};

const DIGIT_GLYPHS = {
  0: ['###', '#.#', '###'],
  1: ['##.', '.#.', '###'],
  2: ['###', '.##', '###'],
  3: ['###', '..#', '###'],
  4: ['#.#', '###', '..#'],
  5: ['###', '##.', '###'],
  6: ['#..', '###', '###'],
  7: ['###', '..#', '..#'],
  8: ['###', '###', '###'],
  9: ['###', '###', '..#'],
};

const PUNCTUATION_GLYPHS = {
  ' ': ['.', '.', '.'], // 띄어쓰기 1칸
  '.': ['.', '.', '#'],
  ',': ['.', '.', '#'],
  '!': ['#', '#', '#'],
  '?': ['###', '.##', '.#.'],
  "'": ['#', '.', '.'],
  '"': ['#.#', '...', '...'],
  '`': ['#', '.', '.'],
  '-': ['...', '###', '...'],
  _: ['...', '...', '###'],
  '+': ['.#.', '###', '.#.'],
  '=': ['###', '...', '###'],
  '*': ['#.#', '.#.', '#.#'],
  '/': ['..#', '.#.', '#..'],
  '\\': ['#..', '.#.', '..#'],
  ':': ['#', '.', '#'],
  ';': ['#', '.', '#'],
  '(': ['.#', '#.', '.#'],
  ')': ['#.', '.#', '#.'],
  '[': ['##', '#.', '##'],
  ']': ['##', '.#', '##'],
  '<': ['..#', '##.', '..#'],
  '>': ['#..', '.##', '#..'],
  '&': ['##.', '###', '###'],
  '@': ['###', '###', '##.'],
  '%': ['#.#', '.#.', '#.#'],
  '#': ['#.#', '###', '#.#'],
  '~': ['...', '###', '...'],
};

// 한글도 영문도 아닌 문자(이모지, 한자 등)
const FALLBACK_GLYPH = ['##', '##', '##'];

const LATIN_GLYPHS = {
  ...UPPERCASE_GLYPHS,
  ...LOWERCASE_GLYPHS,
  ...DIGIT_GLYPHS,
  ...PUNCTUATION_GLYPHS,
};

// ── 한글 ────────────────────────────────────────────────────────
// 완성형 음절은 초성/중성/종성으로 분해해 3x3 격자에 조합한다.
// 자모 규칙 60여 개만으로 11,172자를 모두 그릴 수 있다.
const HANGUL_FIRST = 0xac00;
const HANGUL_LAST = 0xd7a3;
const JUNG_COUNT = 21;
const JONG_COUNT = 28;

// 초성 19개. 왼쪽 2x2 칸에 들어간다.
// 4칸을 다 채우면 음절이 덩어리로 뭉개져서, 쌍자음과 획이 많은 자음만 꽉 채운다.
const CHO_PATTERNS = [
  ['##', '.#'], // ㄱ
  ['##', '##'], // ㄲ
  ['#.', '##'], // ㄴ
  ['##', '#.'], // ㄷ
  ['##', '##'], // ㄸ
  ['##', '##'], // ㄹ
  ['##', '##'], // ㅁ
  ['#.', '##'], // ㅂ
  ['##', '##'], // ㅃ
  ['.#', '#.'], // ㅅ
  ['##', '#.'], // ㅆ
  ['.#', '##'], // ㅇ
  ['##', '.#'], // ㅈ
  ['##', '##'], // ㅉ
  ['##', '.#'], // ㅊ
  ['##', '.#'], // ㅋ
  ['##', '#.'], // ㅌ
  ['##', '##'], // ㅍ
  ['##', '.#'], // ㅎ
];

// 중성 21개의 짜임새. 0 = 세로모음(ㅏ), 1 = 가로모음(ㅗ), 2 = 섞인 모음(ㅘ)
const JUNG_SHAPES = [
  0, 0, 0, 0, 0, 0, 0, 0, // ㅏㅐㅑㅒㅓㅔㅕㅖ
  1, 2, 2, 2, 1, // ㅗㅘㅙㅚㅛ
  1, 2, 2, 2, 1, // ㅜㅝㅞㅟㅠ
  1, 2, 0, // ㅡㅢㅣ
];

// 종성 28개. 초성 아래(마지막 줄 왼쪽 2칸)에 깔린다. 0번(받침 없음)은 비어 있다.
const JONG_PATTERNS = [
  '..', // 없음
  '#.', // ㄱ
  '##', // ㄲ
  '##', // ㄳ
  '#.', // ㄴ
  '##', // ㄵ
  '##', // ㄶ
  '#.', // ㄷ
  '##', // ㄹ
  '##', // ㄺ
  '##', // ㄻ
  '##', // ㄼ
  '##', // ㄽ
  '##', // ㄾ
  '##', // ㄿ
  '##', // ㅀ
  '##', // ㅁ
  '##', // ㅂ
  '##', // ㅄ
  '.#', // ㅅ
  '##', // ㅆ
  '##', // ㅇ
  '#.', // ㅈ
  '#.', // ㅊ
  '#.', // ㅋ
  '##', // ㅌ
  '##', // ㅍ
  '.#', // ㅎ
];

/** 3줄 문자열 배열 → 열 비트마스크 배열 */
function rowsToColumns(rows) {
  const width = Math.max(...rows.map((row) => row.length));
  const columns = [];

  for (let x = 0; x < width; x += 1) {
    let mask = 0;
    for (let y = 0; y < DOT_ROWS; y += 1) {
      if (rows[y]?.[x] === '#') mask |= 1 << y;
    }
    columns.push(mask);
  }
  return columns;
}

// 한글 음절은 4칸을 쓴다. 3칸에 밀어 넣으면 초성과 모음이 붙어 덩어리로 보인다.
const HANGUL_WIDTH = 4;

// 기둥에 짧은 획이 붙는 모음(ㅏ, ㅑ, ㅓ, ㅕ). ㅐ/ㅔ 계열과 ㅣ는 기둥만 세운다.
const VOWEL_WITH_STROKE = new Set([0, 2, 4, 6]);

/** 한글 음절 하나 → 3x4 격자의 열 비트마스크 배열 */
function composeHangul(code) {
  const index = code - HANGUL_FIRST;
  const cho = Math.floor(index / (JUNG_COUNT * JONG_COUNT));
  const jung = Math.floor(index / JONG_COUNT) % JUNG_COUNT;
  const jong = index % JONG_COUNT;

  const grid = Array.from({ length: DOT_ROWS }, () =>
    new Array(HANGUL_WIDTH).fill('.'),
  );
  const setDot = (x, y) => {
    grid[y][x] = '#';
  };
  const choPattern = CHO_PATTERNS[cho];
  const jongPattern = JONG_PATTERNS[jong];
  const shape = JUNG_SHAPES[jung];

  const drawCho = (originY) => {
    for (let y = 0; y < 2; y += 1) {
      for (let x = 0; x < 2; x += 1) {
        if (choPattern[y][x] === '#') setDot(x, originY + y);
      }
    }
  };
  const drawJong = () => {
    for (let x = 0; x < 2; x += 1) {
      if (jongPattern[x] === '#') setDot(x, 2);
    }
  };

  if (shape === 1) {
    // 가로모음(ㅗ, ㅜ, ㅡ): 초성 / 모음 / 받침이 위에서 아래로 쌓인다.
    // 마지막 칸은 비워서 세로모음 음절(기둥이 있는 쪽)과 구분되게 한다.
    for (let x = 0; x < 2; x += 1) {
      if (choPattern[0][x] === '#' || choPattern[1][x] === '#') setDot(x, 0);
    }
    for (let x = 0; x < HANGUL_WIDTH - 1; x += 1) setDot(x, 1);
    drawJong();
  } else if (shape === 2) {
    // 섞인 모음(ㅘ, ㅢ): 초성 왼쪽 위, 모음 기둥 오른쪽, 가로획이 아래에 깔린다.
    drawCho(0);
    setDot(3, 0);
    setDot(3, 1);
    for (let x = 0; x < 3; x += 1) setDot(x, 2);
  } else {
    // 세로모음(ㅏ, ㅣ): 초성이 왼쪽 2x2, 모음 기둥이 오른쪽 끝.
    drawCho(0);
    // 받침이 있으면 기둥을 두 줄만 세운다. 음절이 꽉 차면 글자 리듬이 사라진다.
    const stemRows = jong > 0 ? 2 : DOT_ROWS;
    for (let y = 0; y < stemRows; y += 1) setDot(3, y);
    // ㅏ/ㅑ/ㅓ/ㅕ 는 기둥에 짧은 획이 붙는다. 초성이 아랫줄을 꽉 채우는 자음(ㄴ, ㅁ, ㅇ …)이면
    // 한 줄이 통째로 메워져 음절이 띠처럼 보이므로 생략한다.
    if (VOWEL_WITH_STROKE.has(jung) && choPattern[1] !== '##') setDot(2, 1);
    drawJong();
  }

  return rowsToColumns(grid.map((row) => row.join('')));
}

// ── 일본어 / 한자 ───────────────────────────────────────────────
// 가나는 100자가 넘고 한자는 수천 자라 글자마다 모양을 정의할 수 없다.
// 대신 획수 느낌이 비슷한 패턴 묶음을 두고 코드포인트로 하나를 고른다.
// 같은 글자는 늘 같은 모양이 나오고, 이웃한 글자끼리는 서로 다른 모양이 나온다.
const KANA_PATTERNS = [
  ['#..', '###', '..#'],
  ['.#.', '.#.', '###'],
  ['#.#', '.#.', '.#.'],
  ['##.', '.#.', '.##'],
  ['#..', '###', '...'],
  ['.##', '.#.', '#..'],
  ['#.#', '.##', '...'],
  ['###', '.#.', '..#'],
  ['#..', '.##', '.#.'],
  ['.#.', '###', '..#'],
  ['##.', '..#', '.##'],
  ['#.#', '...', '###'],
  ['.#.', '##.', '..#'],
  ['#..', '.#.', '###'],
];

// 한자는 획이 빽빽해서 가나보다 촘촘한 패턴을 쓴다.
const HANJA_PATTERNS = [
  ['###', '#.#', '###'],
  ['#.#', '###', '#.#'],
  ['###', '###', '.#.'],
  ['##.', '###', '.##'],
  ['###', '.#.', '###'],
  ['#.#', '###', '###'],
  ['.#.', '###', '###'],
  ['###', '###', '#.#'],
];

const KANA_RANGES = [
  [0x3041, 0x30ff], // 히라가나 + 가타카나
  [0x31f0, 0x31ff], // 가타카나 확장
  [0xff66, 0xff9d], // 반각 가타카나
];
const HANJA_RANGES = [
  [0x3400, 0x4dbf], // 한자 확장 A
  [0x4e00, 0x9fff], // 한자
  [0xf900, 0xfaff], // 호환 한자
];

function inRanges(code, ranges) {
  return ranges.some(([start, end]) => code >= start && code <= end);
}

/** 코드포인트로 패턴 하나를 고른다. 이웃한 글자가 같은 모양이 되지 않게 섞는다. */
function pickPattern(patterns, code) {
  const mixed = (code * 2654435761) >>> 0;
  return patterns[mixed % patterns.length];
}

const glyphCache = new Map();

/** 문자 하나 → 열 비트마스크 배열 */
function getGlyphColumns(char) {
  const cached = glyphCache.get(char);
  if (cached) return cached;

  let code = char.codePointAt(0);
  // 전각 영숫자/기호(ａ, １, ！)는 반각으로 옮겨 영문 글리프를 그대로 쓴다.
  if (code >= 0xff01 && code <= 0xff5e) code -= 0xfee0;

  let columns;
  if (code >= HANGUL_FIRST && code <= HANGUL_LAST) {
    columns = composeHangul(code);
  } else if (inRanges(code, KANA_RANGES)) {
    columns = rowsToColumns(pickPattern(KANA_PATTERNS, code));
  } else if (inRanges(code, HANJA_RANGES)) {
    columns = rowsToColumns(pickPattern(HANJA_PATTERNS, code));
  } else {
    columns = rowsToColumns(
      LATIN_GLYPHS[String.fromCodePoint(code)] ?? FALLBACK_GLYPH,
    );
  }

  glyphCache.set(char, columns);
  return columns;
}

/**
 * 문자열을 dot 격자의 열 배열로 바꾼다.
 * 글자 사이는 1칸 비우고, 격자 폭을 넘기면 칸 단위로 잘라낸다.
 *
 * @param {string} text
 * @param {number} columnCount 격자의 전체 열 수
 * @returns {number[]} 길이 columnCount 의 비트마스크 배열 (남는 칸은 0)
 */
export function buildDotColumns(text, columnCount) {
  const columns = new Array(Math.max(columnCount, 0)).fill(0);
  if (!text || columnCount <= 0) return columns;

  let cursor = 0;
  for (const char of Array.from(text)) {
    if (cursor > 0) cursor += 1; // 글자 사이 1칸
    if (cursor >= columnCount) break;

    const glyph = getGlyphColumns(char);
    for (let i = 0; i < glyph.length && cursor < columnCount; i += 1) {
      columns[cursor] = glyph[i];
      cursor += 1;
    }
  }
  return columns;
}
