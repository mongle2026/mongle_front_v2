// 행동 기록(피드 상세 체류 · 음악 들은 시간)을 모아 두었다가 POST /events 로 한 번에 보낸다.
// 추천 피드 개선용이라 실패해도 화면에는 아무 영향이 없다. 로그인했을 때만 모은다.
//
// 보내는 때: 20개가 모였을 때 · 마지막으로 쌓인 뒤 30초 · 앱이 백그라운드로 갈 때
// 회원이 바뀌면(로그아웃 후 다른 계정) 이전 회원의 기록은 보내지 않고 버린다.

import { AppState } from 'react-native';

import apiClient, { isApiConfigured } from '../api/client';
import { useAuthStore } from '../auth/useAuthStore';
import { hasId, toIdKey } from '../utils/id';

export const USER_EVENT_TYPE = Object.freeze({
  FEED_DETAIL_VIEW: 'FEED_DETAIL_VIEW',
  MUSIC_LISTEN: 'MUSIC_LISTEN',
});

// MUSIC_LISTEN 이 끝난 이유. 서버 MusicListenEndReason 과 같다
export const MUSIC_LISTEN_END_REASON = Object.freeze({
  PAUSE: 'PAUSE',
  END: 'END',
  SWITCH: 'SWITCH',
  STOP: 'STOP',
});

const FLUSH_SIZE = 20;
const FLUSH_DELAY = 30_000;
// 서버가 한 번에 받는 최대 개수 (USER_EVENT_BATCH_MAX)
const MAX_BATCH = 50;
// 계속 실패해도 메모리가 늘지 않게 최근 것만 남긴다
const MAX_QUEUE = 200;

let queue = [];
let flushTimer = null;
let isFlushing = false;
let appStateSubscription = null;

const getSignedInUserKey = () => toIdKey(useAuthStore.getState().session?.userId);

const ensureAppStateListener = () => {
  if (appStateSubscription) return;

  appStateSubscription = AppState.addEventListener('change', nextState => {
    if (nextState === 'background' || nextState === 'inactive') {
      void flushEvents();
    }
  });
};

const scheduleFlush = () => {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushEvents();
  }, FLUSH_DELAY);
};

// 이벤트마다 꼭 있어야 하는 대상. 서버 ClientUserEventDto 와 같다
const TARGET_FIELD_BY_TYPE = {
  [USER_EVENT_TYPE.FEED_DETAIL_VIEW]: 'feedId',
  [USER_EVENT_TYPE.MUSIC_LISTEN]: 'musicId',
};

/**
 * @param {object} event
 * @param {string} event.type USER_EVENT_TYPE
 * @param {string|number} [event.feedId] FEED_DETAIL_VIEW: 본 글
 * @param {string|number} [event.musicId] MUSIC_LISTEN: 들은 음악 (서버 음악 id)
 * @param {number} event.durationMs
 * @param {number} [event.positionMs] MUSIC_LISTEN: 멈춘 지점
 * @param {string} [event.endReason] MUSIC_LISTEN: MUSIC_LISTEN_END_REASON
 */
export function logEvent({ type, feedId, musicId, durationMs, positionMs, endReason }) {
  const userKey = getSignedInUserKey();
  const targetField = TARGET_FIELD_BY_TYPE[type];
  const targetId = targetField === 'feedId' ? feedId : musicId;
  if (!isApiConfigured || !userKey || !targetField || !hasId(targetId)) return;

  const safeDuration = Math.round(Number(durationMs));
  if (!Number.isFinite(safeDuration) || safeDuration <= 0) return;

  ensureAppStateListener();

  queue.push({
    userKey,
    body: {
      type,
      [targetField]: String(targetId),
      durationMs: safeDuration,
      ...(Number.isFinite(positionMs) ? { positionMs: Math.max(0, Math.round(positionMs)) } : {}),
      ...(endReason ? { endReason } : {}),
      occurredAt: new Date().toISOString(),
    },
  });

  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);

  if (queue.length >= FLUSH_SIZE) {
    void flushEvents();
  } else {
    scheduleFlush();
  }
}

/** 쌓인 기록을 지금 보낸다. 실패하면 다음에 다시 보낸다 */
export async function flushEvents() {
  if (isFlushing || queue.length === 0) return;

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  const userKey = getSignedInUserKey();

  // 로그아웃했거나 다른 회원으로 바뀌었으면 이전 회원의 기록은 버린다
  queue = userKey ? queue.filter(item => item.userKey === userKey) : [];
  if (queue.length === 0) return;

  isFlushing = true;
  const batch = queue.slice(0, MAX_BATCH);

  try {
    await apiClient.post('/events', { events: batch.map(item => item.body) });
    queue = queue.filter(item => !batch.includes(item));
  } catch (error) {
    const status = error?.response?.status;

    // 4xx 는 다시 보내도 같은 결과라 버린다 (잘못된 값 · 이용 제한 등)
    if (status >= 400 && status < 500) {
      queue = queue.filter(item => !batch.includes(item));
    }
  } finally {
    isFlushing = false;
  }

  if (queue.length >= FLUSH_SIZE) {
    void flushEvents();
  } else if (queue.length > 0) {
    scheduleFlush();
  }
}

/**
 * 미리듣기를 새로 틀 때. 추천 피드의 취향 신호("재생해 본 음악")로 쌓인다.
 * musicId 는 서버 음악 id (응답의 music.musicId). 어디서 틀었는지는 남기지 않는다
 */
export function recordMusicPlay(musicId) {
  if (!isApiConfigured || !getSignedInUserKey() || !hasId(musicId)) return;

  void apiClient.post(`/music/${musicId}/play`).catch(() => {});
}
