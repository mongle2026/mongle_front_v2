/*
 * 편지함 우표 탭(우표함 메인)에서 쓰는 우표 PNG 를 만든다.
 *   - 컬러: 받은 우표. 원본 SVG 를 그대로 그린다.
 *   - 회색: 받지 않은 우표. SVG 필터(흑백 + 블러 + 우표 모양으로 자르기)를 적용해 그린다.
 *
 * 우표함은 탭에 들어갈 때마다 우표 전체를 새로 그려서, 앱에서 SVG(특히 필터)로 그리면 느리다.
 * 같은 모양을 미리 PNG 로 뽑아 두고 우표함 메인에서는 이미지만 보여준다.
 * 회색 필터 값은 shared/components/content/Stamp.jsx 의 UNCOLLECTED_* 와 같아야 한다.
 *
 * 실행 (package.json 을 바꾸지 않도록 --no-save 로 설치한다):
 *   npm install --no-save @resvg/resvg-js
 *   node scripts/generate-stamp-pngs.mjs
 *
 * 입력: assets/envelope/stamps/stamp_*.svg
 * 출력: assets/envelope/stamps/color/stamp_*.png, assets/envelope/stamps/gray/stamp_*.png (같은 이름)
 * 우표를 추가하면 이 스크립트를 다시 돌리고 shared/data/stampImageData.js 에 컬러 · 회색 한 줄씩 추가한다.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STAMP_DIR = join(ROOT, 'assets/envelope/stamps');
const COLOR_OUT_DIR = join(STAMP_DIR, 'color');
const GRAY_OUT_DIR = join(STAMP_DIR, 'gray');

// ── Stamp.jsx 와 같은 값 ──
const STAMP_RATIO = 64 / 44;
const UNCOLLECTED_CONTRAST = 0.04;
const UNCOLLECTED_BASE = 0.68;
const UNCOLLECTED_BLUR = 3;

// ── 우표 탭 칸 크기 (StampSection.jsx 와 같은 계산) ──
// 블러 크기(3)는 화면에 보이는 우표 크기 기준이라, 실제 칸 크기로 그려야 앱과 같은 모양이 된다.
// 기준 화면 폭 393pt (padding.L 12, gap.M 8, 3열)
const REFERENCE_WINDOW_WIDTH = 393;
const STAMP_COLUMNS = 3;
const PADDING_L = 12;
const GAP_M = 8;
// 기기 해상도 대응은 하지 않고, 대부분 기기에서 선명하도록 3배로 하나만 뽑는다
const OUTPUT_SCALE = 3;

const stampWidth =
  (REFERENCE_WINDOW_WIDTH - PADDING_L * 2 - GAP_M * (STAMP_COLUMNS - 1)) / STAMP_COLUMNS;
const stampHeight = Math.round(stampWidth * STAMP_RATIO);

const luminanceRow = [0.2126, 0.7152, 0.0722]
  .map(weight => weight * UNCOLLECTED_CONTRAST)
  .join(' ');
const UNCOLLECTED_COLOR_MATRIX = [
  `${luminanceRow} 0 ${UNCOLLECTED_BASE}`,
  `${luminanceRow} 0 ${UNCOLLECTED_BASE}`,
  `${luminanceRow} 0 ${UNCOLLECTED_BASE}`,
  '0 0 0 1 0',
].join(' ');

// 원본 우표 SVG 의 루트 <svg> 를 칸 크기의 중첩 svg 로 바꾼다 (앱의 width/height 100% + slice 와 같다)
function toNestedStampSvg(source) {
  const withoutXmlHeader = source.replace(/<\?xml[^>]*\?>/, '').trim();
  const rootTag = withoutXmlHeader.match(/<svg\b[^>]*>/);
  if (!rootTag) throw new Error('<svg> 루트를 찾을 수 없습니다.');

  const viewBox = rootTag[0].match(/viewBox="([^"]+)"/)?.[1];
  if (!viewBox) throw new Error('viewBox 가 없습니다.');

  return withoutXmlHeader.replace(
    rootTag[0],
    `<svg x="0" y="0" width="${stampWidth}" height="${stampHeight}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid slice">`,
  );
}

// 받은 우표: 칸 크기에 원본 그대로
function buildColorStampSvg(source) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${stampWidth}" height="${stampHeight}" viewBox="0 0 ${stampWidth} ${stampHeight}">
  ${toNestedStampSvg(source)}
</svg>`;
}

// 받지 않은 우표: Stamp.jsx 의 grayscale 분기와 같은 구조
function buildGrayStampSvg(source) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${stampWidth}" height="${stampHeight}" viewBox="0 0 ${stampWidth} ${stampHeight}">
  <defs>
    <filter id="stampGrayscale" filterUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
      <feColorMatrix type="matrix" values="${UNCOLLECTED_COLOR_MATRIX}" />
      <feGaussianBlur stdDeviation="${UNCOLLECTED_BLUR}" result="blurred" />
      <feComposite in="blurred" in2="SourceGraphic" operator="in" />
    </filter>
  </defs>
  <g filter="url(#stampGrayscale)">${toNestedStampSvg(source)}</g>
</svg>`;
}

const files = readdirSync(STAMP_DIR)
  .filter(name => /^stamp_\d+\.svg$/.test(name))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

const renderPng = svg =>
  new Resvg(svg, {
    fitTo: { mode: 'zoom', value: OUTPUT_SCALE },
    background: 'rgba(0, 0, 0, 0)',
  })
    .render()
    .asPng();

mkdirSync(COLOR_OUT_DIR, { recursive: true });
mkdirSync(GRAY_OUT_DIR, { recursive: true });

for (const name of files) {
  const source = readFileSync(join(STAMP_DIR, name), 'utf8');
  const outName = name.replace(/\.svg$/, '.png');

  const colorPng = renderPng(buildColorStampSvg(source));
  const grayPng = renderPng(buildGrayStampSvg(source));
  writeFileSync(join(COLOR_OUT_DIR, outName), colorPng);
  writeFileSync(join(GRAY_OUT_DIR, outName), grayPng);

  console.log(
    `${outName}  컬러 ${(colorPng.length / 1024).toFixed(1)}KB · 회색 ${(grayPng.length / 1024).toFixed(1)}KB`,
  );
}

console.log(
  `\n${files.length}개 → ${COLOR_OUT_DIR}, ${GRAY_OUT_DIR} (${Math.round(stampWidth * OUTPUT_SCALE)}x${stampHeight * OUTPUT_SCALE}px)`,
);
