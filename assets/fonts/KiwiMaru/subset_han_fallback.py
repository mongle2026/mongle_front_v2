"""한자 대체 폰트(Kiwi Maru Light)에서 Kyobo 한자 대체에 필요한 글자만 남겨 경량판을 만든다.

usage: python subset_han_fallback.py <KiwiMaru-Light.ttf 원본> <출력 ttf>

- Kyobo 텍스트에서 대체 폰트로 그리는 건 한자와 일부 CJK 문장부호뿐이라
  (shared/utils/kyoboGlyphCoverage.js), 가나/라틴 글리프는 버린다.
- 한자는 일본 JIS X 0208 제1수준(2,965자) + 중국 GB2312 1급(3,755자)의 합집합만 남긴다.
  이 밖의 한자는 OS 시스템 폰트로 대체되어 그려진다.
- 힌팅/레이아웃 기능을 제거한다. Kiwi Maru는 SIL OFL이라 서브셋 제작이 허용된다.
"""
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

# kyoboGlyphCoverage.js의 KYOBO_MISSING_CJK_SYMBOLS와 같은 목록
CJK_SYMBOLS = '〄々〆〇〒〜〝〟〠〶'


def is_han(char):
    code = ord(char)
    return 0x3400 <= code <= 0x9FFF or 0xF900 <= code <= 0xFAFF


def enumerate_charset(codec, lead_bytes):
    chars = set()
    for lead in lead_bytes:
        for trail in range(0xA1, 0xFF):
            try:
                chars.add(bytes([lead, trail]).decode(codec))
            except UnicodeDecodeError:
                pass
    return {c for c in chars if len(c) == 1 and is_han(c)}


def main():
    src, out = sys.argv[1:]

    jis_level1 = enumerate_charset('euc_jp', range(0xB0, 0xD0))
    gb2312_level1 = enumerate_charset('gb2312', range(0xB0, 0xD8))
    chars = jis_level1 | gb2312_level1 | set(CJK_SYMBOLS)

    font = TTFont(src)
    cmap = font.getBestCmap()
    unicodes = sorted(ord(c) for c in chars if ord(c) in cmap)

    options = subset.Options()
    options.hinting = False
    options.layout_features = []
    options.name_IDs = ['*']
    options.notdef_outline = True

    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=unicodes)
    subsetter.subset(font)
    font.save(out)
    print(f'kept {len(unicodes)} chars -> {out}')


if __name__ == '__main__':
    main()
