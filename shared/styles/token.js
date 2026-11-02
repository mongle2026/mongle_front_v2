// ── 레이아웃 토큰: Figma Token 컬렉션 (Padding / Gap / Radius) ──────

export const padding = { XXS: 2, XS: 4, S: 6, M: 8, L: 12, XL: 16, XXL: 20 };

export const gap = { XS: 2, S: 4, M: 8, L: 12, XL: 20, XXL: 32 };

// 라운딩은 짧은 변으로 정한다: 24 이하 XS / 25~36 S / 37~48 M / 49 이상 XL. 카드는 크기와 상관없이 M, 앨범 커버는 XS, 원형 · 알약은 999
export const radius = { XS: 5, S: 8, M: 10, XL: 12, 999: 999 };
