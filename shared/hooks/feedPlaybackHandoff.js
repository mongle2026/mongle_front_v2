/*
 * 피드 홈에서 재생 중인 피드의 상세로 바로 들어갈 때, 홈의 플레이어를 상세 화면에 넘겨
 * 노래가 끊기지 않고 이어지게 한다.
 *
 * 홈이 이동 직전에 넘길 정보를 올려 두고, 같은 피드의 상세 화면이 열리면서 가져간다.
 * 플레이어 자체는 계속 홈(useAudioPlayer)이 갖고 있고, 상세는 잠시 빌려 쓰는 것이다.
 *
 * handoff = {
 *   feedId, player,
 *   pendingPlay,               // 아직 불러오는 중이라 불러오면 틀어야 하는지
 *   waitingForLoadTransition,
 *   revoked,                   // 홈이 다시 가져갔거나 상세가 닫혀 더는 빌려 쓰지 않는지
 *   onRevoke,                  // 홈이 다시 가져갈 때 상세 쪽 페이드를 멈추는 함수
 * }
 */
let pendingHandoff = null;

export const offerPlaybackHandoff = handoff => {
  pendingHandoff = handoff;
};

/** 같은 피드에 올려 둔 handoff 를 돌려준다. 가져가는 것(clear)은 따로 한다 */
export const findPlaybackHandoff = feedId => {
  if (!feedId || !pendingHandoff || pendingHandoff.revoked) return null;
  return pendingHandoff.feedId === feedId ? pendingHandoff : null;
};

export const clearPlaybackHandoff = handoff => {
  if (pendingHandoff === handoff) pendingHandoff = null;
};
