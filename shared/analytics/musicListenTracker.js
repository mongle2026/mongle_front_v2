// 미리듣기를 실제로 얼마나 들었는지 잰다 (MUSIC_LISTEN).
// 앱에서 동시에 나오는 소리는 하나뿐이라 앱 전체에서 하나만 둔다.
// 홈에서 틀던 곡을 상세가 이어받으면(handoff) 같은 플레이어 · 같은 재생 id 라 한 번 들은 것으로 이어서 잰다.
//
// 플레이어 상태가 바뀔 때마다 update 를 부른다. 소리가 나기 시작하면 재기 시작하고,
// 멈추면 그때까지 들은 시간 · 멈춘 지점 · 멈춘 이유를 음악 id 로 기록한다 (어디서 틀었는지는 남기지 않는다).
// 멈춘 이유는 멈추게 한 쪽이 setEndReason 으로 미리 알려 준다. 알려 주지 않았으면 STOP.
//
// player 는 기록을 시작한 플레이어. 홈 플레이어가 페이드아웃으로 늦게 멈춘 알림이
// 상세 플레이어에서 시작한 기록을 끝내지 않도록, 시작한 플레이어만 그 기록을 끝낼 수 있다.
// musicId 가 없는 재생(글쓰기 화면의 미리듣기)은 기록하지 않는다.

import { MUSIC_LISTEN_END_REASON, USER_EVENT_TYPE, logEvent } from './eventQueue';
import { toIdKey } from '../utils/id';

let session = null; // { player, playbackId, musicId, startedAt, positionMs, endReason }

const finish = reason => {
  if (!session) return;

  const { musicId, startedAt, positionMs, endReason } = session;
  session = null;

  logEvent({
    type: USER_EVENT_TYPE.MUSIC_LISTEN,
    musicId,
    durationMs: Date.now() - startedAt,
    positionMs,
    endReason: reason ?? endReason ?? MUSIC_LISTEN_END_REASON.STOP,
  });
};

export const musicListenTracker = {
  /** 곧 멈출 이유. 이 플레이어의 소리가 다음에 멈출 때 이 이유로 기록한다 */
  setEndReason(player, reason) {
    if (session?.player === player) session.endReason = reason;
  },

  /**
   * @param {object} player 상태를 알려 온 플레이어
   * @param {object} params
   * @param {string|number|null} params.playbackId 지금 플레이어에 올라 있는 재생 id (화면마다 피드 id · 'letter-{id}' 등)
   * @param {string|number|null} params.musicId 그 곡의 서버 음악 id. 없으면 기록하지 않는다
   * @param {boolean} params.playing 소리가 나고 있는지
   * @param {number} [params.currentTime] 곡 안의 위치(초)
   * @param {boolean} [params.didJustFinish]
   */
  update(player, { playbackId, musicId, playing, currentTime, didJustFinish }) {
    const isOwner = session?.player === player;

    if (isOwner && Number.isFinite(currentTime)) {
      session.positionMs = currentTime * 1000;
    }

    if (!playing || didJustFinish) {
      // 다른 플레이어가 멈춘 알림은 지금 기록과 상관없다
      if (isOwner) finish(didJustFinish ? MUSIC_LISTEN_END_REASON.END : undefined);
      return;
    }

    const playbackKey = toIdKey(playbackId);

    // 다른 곡(또는 다른 플레이어)에서 소리가 나기 시작했다
    if (session && playbackKey && (!isOwner || session.playbackId !== playbackKey)) {
      finish(MUSIC_LISTEN_END_REASON.SWITCH);
    }

    // 재생을 멈추려고 재생 id 를 비운 뒤에도 페이드아웃 동안은 소리가 나므로 이어서 잰다
    const musicKey = toIdKey(musicId);
    if (!session && playbackKey && musicKey) {
      session = {
        player,
        playbackId: playbackKey,
        musicId: musicKey,
        startedAt: Date.now(),
        positionMs: Number.isFinite(currentTime) ? currentTime * 1000 : undefined,
        endReason: null,
      };
    }
  },

  /** 상태 알림 없이 소리가 끊길 때 (화면이 닫혀 플레이어가 정리되는 경우 등) */
  stop(player, reason) {
    if (session?.player === player) finish(reason);
  },
};
