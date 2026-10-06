# Fonts

`shared/styles/fonts.js`의 `fontMap`이 아래 파일들을 참조합니다. 패밀리별 하위 폴더에 배치합니다.

| 경로 | 용도 (typo.js fontFamily) |
| --- | --- |
| `SUITX/SUITX-Regular.ttf`  | `SUITX-Regular` (400) |
| `SUITX/SUITX-SemiBold.ttf` | `SUITX-SemiBold` (600) |
| `SUITX/SUITX-Bold.ttf`     | `SUITX-Bold` (700) |
| `Kyobo/KyoboHandwriting2025lyb.ttf` | `KyoboHandwriting2025` |
| `KiwiMaru/KiwiMaru-Light.subset.ttf` | `KiwiMaru-Light` (Kyobo 한자 대체용) |

- SUITX: SUIT 2.040(https://sunn.us/suit/)에서 윤곽선이 비어 있던 한글 8,504자를
  Source Han Sans KR(https://github.com/adobe-fonts/source-han-sans)로 채운 폰트입니다. 두 원본 모두 SIL OFL이므로 SUITX도 OFL입니다.
  - 다시 만드는 방법: `SUITX/build_suitx.py` (fontTools, numpy 필요)
    `python build_suitx.py <SUIT ttf 폴더> <SourceHanSansKR SubsetOTF 폴더> <출력 폴더> Regular SemiBold Bold`
  - 기존 SUIT 한글과 점 단위로 맞춰 SHS 굵기(인접한 두 굵기 사이 보간)와 스케일/오프셋을 자동으로 정합니다.
  - 현대 한글 11,172자를 모두 그리므로 런타임 글자 대체가 필요 없습니다. 세로 메트릭(ascent/descent)은 원본 SUIT와 같습니다.
  - Regular(400)/SemiBold(600)/Bold(700)이 있습니다. Figma의 Medium은 Regular로 매핑합니다.
  - 라이선스/저작권 표기: `SUITX/OFL.txt`
- Kyobo Handwriting 2025: 교보문고 배포 폰트 (라이선스 확인 후 사용)
  - 한자가 하나도 없어서, Kyobo 텍스트의 한자는 `FontFallbackText`가 Kiwi Maru Light로 대체해 그립니다.
    폰트 파일 자체는 수정하지 않습니다(Kyobo 라이선스상 파일 수정 금지).
- Kiwi Maru Light: https://github.com/Kiwi-KawagotoKajiru/Kiwi-Maru, SIL OFL (`KiwiMaru/OFL.txt`)
  - 용량을 줄이려고 JIS 제1수준 + GB2312 1급 한자 중 폰트에 있는 글자(한자 3,653자 + CJK 기호)만 남긴 서브셋입니다(5.0MB → 2.0MB). 그 밖의 한자는 시스템 폰트로 그려집니다.
    한국 표준 한자(KS X 1001, 4,620자) 중 2,931자만 포함되어 있습니다.
  - `FontFallbackText`로 감싼 Text에서만 대체됩니다. `TextInput`(글쓰기 에디터 등)에서는 한자가 시스템 폰트로 보입니다.
  - 다시 만드는 방법: `KiwiMaru/subset_han_fallback.py` (fontTools 필요)
    `python subset_han_fallback.py <KiwiMaru-Light.ttf 원본> KiwiMaru-Light.subset.ttf`

파일 경로/이름이 바뀌면 `shared/styles/fonts.js`의 `require` 경로도 함께 수정하세요.
