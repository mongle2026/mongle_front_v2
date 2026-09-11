import {
  PATTERNS,
  STAMPS,
} from '../data/envelopeData';

export function resolvePatternColor(
  patternColorId,
) {
  for (const pattern of PATTERNS) {
    const color = pattern.colors.find(
      (item) => item.id === patternColorId,
    );

    if (color) {
      return {
        pattern,
        color,
      };
    }
  }

  return null;
}

/*
 * envelopeData 의 frontImg / flapImg 는 require('...svg') 결과라
 * ESM 상호운용에 따라 컴포넌트가 { default } 로 감싸질 수 있다.
 * 렌더에 바로 쓸 수 있도록 컴포넌트만 꺼낸다.
 */
function toSvgComponent(mod) {
  return mod?.default ?? mod ?? null;
}

export function resolveEnvelope({
  patternId,
  colorId,
  stampId,
}) {
  const pattern = PATTERNS.find(
    (item) => item.id === patternId,
  );

  const color = pattern?.colors.find(
    (item) => item.id === colorId,
  );

  const stamp = STAMPS.find(
    (item) => item.id === stampId,
  );

  return {
    pattern: pattern ?? null,
    color: color ?? null,
    stamp: stamp ?? null,

    /* 봉투 앞면(body) / 덮개(flap) / 우표 SVG 컴포넌트 */
    FrontSvg: color
      ? toSvgComponent(color.frontImg)
      : null,
    FlapSvg: color
      ? toSvgComponent(color.flapImg)
      : null,
    StampSvg: stamp?.SvgComponent ?? null,
  };
}