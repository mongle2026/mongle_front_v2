// 장르·월 카드 커버는 서버가 고른다. 앱 실행마다 새로 만든 이 값을 보내면
// 앱이 켜져 있는 동안은 어느 화면에서 불러도 같은 커버가 오고, 앱을 다시 켜면 새로 고른다.
export const SESSION_COVER_SEED = Math.random().toString(36).slice(2, 12);
