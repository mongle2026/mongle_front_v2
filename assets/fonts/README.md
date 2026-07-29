# Fonts

`shared/styles/fonts.js`의 `fontMap`이 아래 파일들을 참조합니다. 이 폴더에 정확한 파일명으로 넣어주세요.

| 파일명 | 용도 (typo.js fontFamily) |
| --- | --- |
| `SUIT-Regular.otf`  | `SUIT-Regular` |
| `SUIT-Medium.otf`   | `SUIT-Medium` |
| `SUIT-SemiBold.otf` | `SUIT-SemiBold` |
| `SUIT-Bold.otf`     | `SUIT-Bold` |
| `KyoboHandwriting2025.ttf` | `KyoboHandwriting2025` |

- SUIT: https://sunn.us/suit/ (SIL OFL, 무료)
- Kyobo Handwriting 2025: 교보문고 배포 폰트 (라이선스 확인 후 사용)

확장자가 다르면(`.ttf` ↔ `.otf`) `shared/styles/fonts.js`의 `require` 경로도 함께 수정하세요.
