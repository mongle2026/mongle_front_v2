# 라운딩 가이드

## 토큰

`shared/styles/token.js`의 `radius`만 씁니다. 숫자를 직접 적지 않습니다.

| 토큰 | 값 | 쓰임 |
|---|---|---|
| `radius.XS` | 5 | 짧은 변 24 이하 |
| `radius.S` | 8 | 짧은 변 25~36 |
| `radius.M` | 10 | 짧은 변 37~48 |
| `radius.XL` | 12 | 짧은 변 49 이상 |
| `radius[999]` | 999 | 원형 · 알약 모양 |

## 기본 규칙: 짧은 변으로 정한다

요소의 짧은 변 길이로 토큰을 고릅니다. 역할(버튼, 카드 등)로 고르지 않습니다.

| 짧은 변 | 토큰 | 예시 |
|---|---|---|
| 24 이하 | XS | ProfileImg S, IconButton S, UsernameTag, TabBar 밑줄, BottomSheet 손잡이 |
| 25~36 | S | Button S · M, ProfileImg M, IconButton M · L, TopNavigation Item, 작성 LabeledButton |
| 37~48 | M | Button L, FAB, SearchField, TextField, Toast, LabeledButton M |
| 49 이상 | XL | Button XL, Dialog, BottomSheet, Menu, Comment, ListRow, WriteImg, Templete, StampItem, PatternItem |

- 높이가 내용에 따라 변하는 요소는 한 줄일 때의 높이로 정합니다.
- 배경이 없어 모서리가 보이지 않는 컨테이너도 같은 규칙을 따릅니다.

## 예외

아래 경우는 짧은 변과 상관없이 정해진 값을 씁니다.

| 대상 | 토큰 | 이유 |
|---|---|---|
| 카드 (PostCard, OthersPostCard, ShortPostCard, GridCard, GenreCard, letterbox Card, ProfileMusicCard) | M | 대부분 49 이상이지만 FAB(M)와 맞춘다 |
| 카드를 꽉 채우는 커버 (GenreCard, ProfileMusicCard) | M | 카드 모서리와 같아야 틈이 생기지 않는다. `MusicCoverImg`의 `borderRadius` prop으로 넘긴다 |
| 앨범 커버 (`MusicCoverImg` 기본값) | XS | 크게 표시해도 네모난 재킷처럼 보이게 한다 |
| 카드 안쪽 사진 (OthersPostCard, ShortPostCard의 `WriteImg`) | XS | 위쪽 앨범 커버(XS)와 맞추고, 카드(M)보다 덜 둥글게 한다 |
| 템플릿 봉투 썸네일 (`Templete`의 `patternSlot`) | XS | 면이 꽉 찬 썸네일은 XL이면 너무 둥글다. 우표 슬롯과 바깥 container는 XL |
| ProfileImg L (40, ListRow 이미지) | S | 행 배경(XL) 안의 작은 이미지라 한 단계 덜 둥글게 한다 |
| 전송 카드 (`SendContentCard`) | 음악 XS, 그 외 XL | 음악 장은 앨범 커버와 맞춘다 |
| 원형 · 알약: Tabs 항목과 활성 칩, 토글, 체크, 재생 버튼, 색상 칩, 숫자 · 프로필 배지, 실패 아이콘 원, 점, 로딩 꽃잎 | 999 | 크기와 상관없이 `radius[999]`. `크기 / 2` 같은 계산값을 쓰지 않는다 |

## 새 요소에 적용하는 순서

1. 원형 · 알약 모양이면 `radius[999]`
2. 위 예외 표에 해당하면 그 값
3. 아니면 짧은 변을 재서 기본 규칙 표대로
4. 안쪽 요소가 바깥 요소보다 둥글어 보이면 예외로 둘지 디자인과 먼저 정한다
