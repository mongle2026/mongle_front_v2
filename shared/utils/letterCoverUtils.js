import {
  PATTERNS,
  STAMPS,
} from '../data/letterCoverData';

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

export function resolveLetterCover({
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
  };
}