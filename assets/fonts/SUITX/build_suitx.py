"""SUIT의 빈 한글 음절 윤곽선을 Source Han Sans KR로 채워 SUITX를 만든다.

usage: python build_suitx.py <SUIT ttf dir> <SourceHanSansKR SubsetOTF dir> <out dir> Regular SemiBold Bold

- SUIT 한글은 SHS에서 파생된 글리프라, 이미 채워진 글자들과 SHS를 점 단위로 맞춰
  (인접 두 굵기 a,b 사이 보간 비율 t, x/y 스케일, 오프셋)을 최소자승으로 구한다.
- 빈 글리프(numberOfContours == 0)만 교체하므로 글리프 순서/cmap/GSUB/GPOS는 그대로다.
"""
import random
import sys
from pathlib import Path

import numpy as np
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

HANGUL = range(0xAC00, 0xD7A4)
SHS_WEIGHTS = ['ExtraLight', 'Light', 'Normal', 'Regular', 'Medium', 'Bold', 'Heavy']
FAMILY = 'SUITX'
T_GRID = np.round(np.arange(0, 1.0001, 0.05), 2)


def record(gs, name):
    pen = RecordingPen()
    gs[name].draw(pen)
    return pen.value


def signature(value):
    return [(op, len(args)) for op, args in value]


def flatten(value):
    return np.array([pt for _, args in value for pt in args], float).reshape(-1, 2)


def oncurve(value):
    return np.array([args[-1] for _, args in value if args], float)


def interpolate(va, vb, t):
    """호환되는 두 윤곽선을 t로 보간. 호환이 안 되면 가까운 쪽을 그대로 쓴다."""
    if vb is None or t == 0:
        return va
    if signature(va) != signature(vb):
        return va if t < 0.5 else vb
    out = []
    for (op, a), (_, b) in zip(va, vb):
        out.append((op, tuple((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t) for (x0, y0), (x1, y1) in zip(a, b))))
    return out


def fit(samples, t):
    """samples: [(suit_oncurve, shs_a_value, shs_b_value)] -> (sx, dx, sy, dy, median_err)"""
    X, Y = [], []
    for P, va, vb in samples:
        Q = oncurve(interpolate(va, vb, t))
        guess = Q * 0.97 + [-9, 1]
        j = ((P[:, None, :] - guess[None, :, :]) ** 2).sum(-1).argmin(0)
        X.append(Q)
        Y.append(P[j])
    X, Y = np.vstack(X), np.vstack(Y)
    coef = []
    for k in (0, 1):
        A = np.c_[X[:, k], np.ones(len(X))]
        coef.append(np.linalg.lstsq(A, Y[:, k], rcond=None)[0])
    err = np.hypot(X[:, 0] * coef[0][0] + coef[0][1] - Y[:, 0], X[:, 1] * coef[1][0] + coef[1][1] - Y[:, 1])
    return coef[0][0], coef[0][1], coef[1][0], coef[1][1], float(np.median(err))


def choose_weight(suit, shs):
    """SUIT 기존 한글과 가장 잘 맞는 SHS 굵기(인접 쌍 + 보간 비율)를 고른다."""
    cmap = suit.getBestCmap()
    gs = suit.getGlyphSet()
    filled = [c for c in HANGUL if suit['glyf'][cmap[c]].numberOfContours > 0]
    rng = random.Random(0)
    probe = rng.sample(filled, 120)

    # 1) 잉크 면적으로 대략적인 굵기 위치를 잡고 2) 그 주변 쌍에서 t를 촘촘히 탐색
    best = None
    for a, b in zip(SHS_WEIGHTS, SHS_WEIGHTS[1:]):
        ga, gb = shs[a].getGlyphSet(), shs[b].getGlyphSet()
        ca, cb = shs[a].getBestCmap(), shs[b].getBestCmap()
        samples = []
        for c in probe:
            va, vb = record(ga, ca[c]), record(gb, cb[c])
            if signature(va) == signature(vb):
                samples.append((oncurve(record(gs, cmap[c])), va, vb))
        for t in T_GRID:
            r = fit(samples, t)
            if best is None or r[4] < best[3][4]:
                best = (a, b, t, r)

    a, b, t, _ = best
    # 최종 변환값은 더 큰 표본으로 다시 피팅
    ga, gb = shs[a].getGlyphSet(), shs[b].getGlyphSet()
    ca, cb = shs[a].getBestCmap(), shs[b].getBestCmap()
    samples = []
    for c in rng.sample(filled, 400):
        va, vb = record(ga, ca[c]), record(gb, cb[c])
        if signature(va) == signature(vb):
            samples.append((oncurve(record(gs, cmap[c])), va, vb))
    return a, b, t, fit(samples, t)


def rename(font, style):
    # Regular/Bold는 RIBBI 스타일이라 원본 SUIT처럼 패밀리 하나에 ID2로 구분한다.
    is_ribbi = style in ('Regular', 'Bold')
    ps = f'{FAMILY}-{style}'
    values = {
        1: FAMILY if is_ribbi else f'{FAMILY} {style}',
        2: style if is_ribbi else 'Regular',
        3: None,
        4: f'{FAMILY} {style}',
        6: ps,
        16: FAMILY,
        17: style,
    }
    name = font['name']
    for rec in name.names:
        if rec.nameID == 3:
            rec.string = rec.toUnicode().replace(f'SUIT-{style}', ps)
        elif rec.nameID == 5:
            v = rec.toUnicode()
            if 'Source Han Sans' not in v:
                rec.string = v + '; Hangul filled from Source Han Sans KR'
        elif rec.nameID in values and values[rec.nameID] is not None:
            rec.string = values[rec.nameID]
    if not any(r.nameID == 16 for r in name.names):
        name.setName(FAMILY, 16, 3, 1, 0x409)
        name.setName(style, 17, 3, 1, 0x409)


def build(suit_path, shs, out_path, style):
    font = TTFont(suit_path)
    cmap = font.getBestCmap()
    glyf, hmtx = font['glyf'], font['hmtx']
    gs = font.getGlyphSet()

    a, b, t, (sx, dx, sy, dy, err) = choose_weight(font, shs)
    print(f'[{style}] SHS {a}->{b} t={t:.2f}  sx={sx:.5f} sy={sy:.5f} dx={dx:.2f} dy={dy:.2f}  median err={err:.2f}u')

    filled = [c for c in HANGUL if glyf[cmap[c]].numberOfContours > 0]
    adv = max(set(hmtx[cmap[c]][0] for c in filled), key=[hmtx[cmap[c]][0] for c in filled].count)

    ga, gb = shs[a].getGlyphSet(), shs[b].getGlyphSet()
    ca, cb = shs[a].getBestCmap(), shs[b].getBestCmap()
    added = fallback = 0
    for c in HANGUL:
        gname = cmap[c]
        if glyf[gname].numberOfContours != 0:
            continue
        va, vb = record(ga, ca[c]), record(gb, cb[c])
        if signature(va) != signature(vb):
            fallback += 1
        value = interpolate(va, vb, t)

        tt = TTGlyphPen(None)
        # CFF(반시계) -> TrueType(시계) 방향 뒤집기, 오차 1unit 이내 2차 곡선 근사
        pen = TransformPen(Cu2QuPen(tt, max_err=1.0, reverse_direction=True), (sx, 0, 0, sy, dx, dy))
        for op, args in value:
            getattr(pen, op)(*args)
        g = tt.glyph()
        g.recalcBounds(glyf)
        glyf[gname] = g
        hmtx[gname] = (adv, g.xMin)
        added += 1

    print(f'[{style}] filled {added} glyphs (advance {adv}), {fallback} used nearest weight (incompatible outlines)')

    # 글리프가 바뀌어 기존 디지털 서명은 무효
    if 'DSIG' in font:
        del font['DSIG']
    rename(font, style)
    font.save(out_path)
    return font


def main():
    suit_dir, shs_dir, out_dir, *styles = sys.argv[1:]
    shs = {w: TTFont(Path(shs_dir) / f'SourceHanSansKR-{w}.otf') for w in SHS_WEIGHTS}
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    for style in styles:
        build(Path(suit_dir) / f'SUIT-{style}.ttf', shs, Path(out_dir) / f'{FAMILY}-{style}.ttf', style)


if __name__ == '__main__':
    main()
