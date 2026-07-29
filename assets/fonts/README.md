# Fonts

`shared/styles/fonts.js`의 `fontMap`이 아래 파일들을 참조합니다. 패밀리별 하위 폴더에 배치합니다.

| 경로 | 용도 (typo.js fontFamily) |
| --- | --- |
| `SUIT/SUIT-Regular.ttf`  | `SUIT-Regular` |
| `SUIT/SUIT-Medium.ttf`   | `SUIT-Medium` |
| `SUIT/SUIT-SemiBold.ttf` | `SUIT-SemiBold` |
| `SUIT/SUIT-Bold.ttf`     | `SUIT-Bold` |
| `Kyobo/KyoboHandwriting2025lyb.ttf` | `KyoboHandwriting2025` |

- SUIT: https://sunn.us/suit/ (SIL OFL, 무료)
- Kyobo Handwriting 2025: 교보문고 배포 폰트 (라이선스 확인 후 사용)

파일 경로/이름이 바뀌면 `shared/styles/fonts.js`의 `require` 경로도 함께 수정하세요.
