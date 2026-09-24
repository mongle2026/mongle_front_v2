// 장르·월 카드의 커버는 후보 중 하나를 랜덤으로 고른다.
// 고른 값은 모듈 변수에 두어 앱이 켜져 있는 동안 유지하고, 앱을 다시 켜면 새로 고른다.
// 고른 커버가 후보에서 빠지면(글 삭제 등) 그때만 다시 고른다.
const coverByKey = new Map();

export const pickSessionCover = (key, artworks) => {
  if (!Array.isArray(artworks) || artworks.length === 0) return null;

  const pickedCover = coverByKey.get(key);
  if (pickedCover && artworks.includes(pickedCover)) return pickedCover;

  const nextCover = artworks[Math.floor(Math.random() * artworks.length)];
  coverByKey.set(key, nextCover);

  return nextCover;
};
