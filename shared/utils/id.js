// 서버 id(PK)는 프론트에서 '불투명한 문자열'로 다룬다.
// 지금은 숫자지만 UUID 같은 문자열로 바뀌면 Number()는 NaN이 되고,
// 2^53을 넘는 큰 숫자 id는 Number()로 값이 바뀌기 때문에 Number 변환을 쓰지 않는다.
// 요청 바디에는 서버가 준 값을 그대로 보내고, 쿼리 키와 비교에서만 문자열로 맞춘다.

export const hasId = id =>
  id !== null && id !== undefined && String(id).trim() !== '';

// react-query 키에 넣을 id
export const toIdKey = id => (hasId(id) ? String(id) : null);

export const isSameId = (a, b) =>
  hasId(a) && hasId(b) && String(a) === String(b);
