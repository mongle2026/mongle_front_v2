import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';

import { toIdKey } from '../utils/id';
import { MUSIC_LISTEN_END_REASON, recordMusicPlay } from '../analytics/eventQueue';
import { musicListenTracker } from '../analytics/musicListenTracker';
import {
  clearPlaybackHandoff,
  findPlaybackHandoff,
  offerPlaybackHandoff,
} from './feedPlaybackHandoff';

const PLAYBACK_END_TOLERANCE = 0.1;

/*
 * 재생 · 정지를 볼륨으로 부드럽게 잇는다.
 * 틀 때는 0 에서 서서히 커지고, 끄거나 다른 곡으로 바꿀 때는 서서히 작아진 뒤 멈춘다.
 */
const FADE_IN_DURATION = 450;
const FADE_OUT_DURATION = 220;
// 다른 곡으로 바꿀 때는 기다리는 느낌이 없도록 더 짧게 줄인다
const SWITCH_FADE_OUT_DURATION = 120;
const FADE_STEP_INTERVAL = 16;

const easeOutQuad = t => 1 - (1 - t) * (1 - t);
const easeInQuad = t => t * t;

const normalizePreviewUrl = previewUrl => {
  if (typeof previewUrl !== 'string') return null;
  return previewUrl.trim() || null;
};

/**
 * @param {object} params
 * @param {object} params.navigation
 * @param {string|number} [params.handoffFeedId]
 *   피드 상세처럼 한 피드만 보여 주는 화면에서 넘긴다.
 *   피드 홈에서 이 피드를 재생하다 바로 들어왔으면 홈의 재생을 이어받는다.
 */
const useFeedMusicPlayback = ({ navigation, handoffFeedId }) => {
  const ownPlayer = useAudioPlayer(null);

  // 홈에서 넘겨받은 재생. 화면이 열릴 때 한 번만 정한다
  const [handoff] = useState(() => findPlaybackHandoff(toIdKey(handoffFeedId)));
  const player = handoff?.player ?? ownPlayer;

  const loadedFeedIdRef = useRef(handoff?.feedId ?? null);
  // 지금 올려 둔 곡의 서버 음악 id. 재생 기록에 쓴다 (글쓰기 화면처럼 없으면 기록하지 않는다)
  const loadedMusicIdRef = useRef(handoff?.musicId ?? null);
  const pendingPlayFeedIdRef = useRef(handoff?.pendingPlay ? handoff.feedId : null);
  const waitingForLoadTransitionRef = useRef(handoff?.waitingForLoadTransition ?? false);
  const playbackStatusRef = useRef(handoff ? handoff.player.currentStatus ?? null : null);

  const initialPlayingFeedId = handoff && !handoff.pendingPlay ? handoff.feedId : null;
  const playingFeedIdRef = useRef(initialPlayingFeedId);
  const [playingFeedId, setPlayingFeedId] = useState(initialPlayingFeedId);

  // 내 플레이어를 상세 화면에 넘겨 둔 상태 (홈 쪽). 다시 가져올 때까지 플레이어를 건드리지 않는다
  const handedOffRef = useRef(null);

  /** 지금 이 화면이 플레이어를 다뤄도 되는지 */
  const canControlPlayer = useCallback(
    () => !handedOffRef.current && !handoff?.revoked,
    [handoff]
  );

  // 진행 중인 볼륨 페이드. 새 동작이 시작되면 이전 페이드는 취소한다
  const fadeRef = useRef({ timer: null, resolve: null });
  // 페이드아웃 중에는 소리가 아직 나도 UI 는 '정지'로 보여야 한다
  const isFadingOutRef = useRef(false);

  const cancelFade = useCallback(() => {
    const fade = fadeRef.current;

    if (fade.timer) clearInterval(fade.timer);
    fade.resolve?.(false);

    fadeRef.current = { timer: null, resolve: null };
    isFadingOutRef.current = false;
  }, []);

  /**
   * player.volume 을 to 까지 duration 동안 바꾼다.
   * @returns {Promise<boolean>} 끝까지 갔으면 true, 다른 동작으로 취소됐으면 false
   */
  const fadeVolume = useCallback(
    (to, duration, easing) =>
      new Promise(resolve => {
        cancelFade();

        const from = Number.isFinite(player.volume) ? player.volume : 1;
        const startedAt = Date.now();

        const timer = setInterval(() => {
          const progress = Math.min(1, (Date.now() - startedAt) / duration);

          try {
            player.volume = from + (to - from) * easing(progress);
          } catch {
            // 플레이어가 정리된 뒤라면 그냥 멈춘다
          }

          if (progress >= 1) {
            clearInterval(timer);
            fadeRef.current = { timer: null, resolve: null };
            resolve(true);
          }
        }, FADE_STEP_INTERVAL);

        fadeRef.current = { timer, resolve };
      }),
    [cancelFade, player]
  );

  const playWithFadeIn = useCallback(() => {
    cancelFade();

    player.volume = 0;
    player.play();

    void fadeVolume(1, FADE_IN_DURATION, easeOutQuad);
  }, [cancelFade, fadeVolume, player]);

  /** 서서히 줄인 뒤 멈춘다. 중간에 다른 곡을 틀면 멈추지 않는다 */
  const pauseWithFadeOut = useCallback(
    async (duration = FADE_OUT_DURATION) => {
      if (!playbackStatusRef.current?.playing) {
        cancelFade();
        player.pause();
        return true;
      }

      const fade = fadeVolume(0, duration, easeInQuad);
      isFadingOutRef.current = true;

      const isCompleted = await fade;
      if (!isCompleted) return false;

      isFadingOutRef.current = false;
      player.pause();
      return true;
    },
    [cancelFade, fadeVolume, player]
  );

  // 화면을 떠날 때 진행 중인 페이드 타이머를 정리한다
  useEffect(() => cancelFade, [cancelFade]);

  // 화면이 닫히면 플레이어가 상태 알림 없이 멈출 수 있어서, 이 플레이어로 재던 들은 시간을 여기서 끝낸다
  useEffect(() => () => musicListenTracker.stop(player), [player]);

  const updatePlayingFeedId = useCallback(nextFeedId => {
    if (playingFeedIdRef.current === nextFeedId) return;

    playingFeedIdRef.current = nextFeedId;
    setPlayingFeedId(nextFeedId);
  }, []);

  const stopAndReset = useCallback(() => {
    pendingPlayFeedIdRef.current = null;
    waitingForLoadTransitionRef.current = false;
    if (canControlPlayer()) void pauseWithFadeOut();
    playbackStatusRef.current = null;

    loadedFeedIdRef.current = null;
    loadedMusicIdRef.current = null;

    updatePlayingFeedId(null);
  }, [canControlPlayer, pauseWithFadeOut, updatePlayingFeedId]);

  /*
   * (상세 쪽) 홈에서 넘겨받았으면 올려 둔 handoff 를 치우고,
   * 홈에서 키우던 볼륨을 마저 키운다.
   * 화면이 닫힐 때는 플레이어가 홈에 남아 계속 나오지 않도록 멈춘다.
   */
  useEffect(() => {
    if (!handoff) return undefined;

    clearPlaybackHandoff(handoff);
    handoff.onRevoke = cancelFade;

    if (!handoff.pendingPlay && Number.isFinite(player.volume) && player.volume < 1) {
      void fadeVolume(1, FADE_IN_DURATION, easeOutQuad);
    }

    return () => {
      if (handoff.revoked) return;

      handoff.revoked = true;
      cancelFade();

      try {
        player.pause();
      } catch {
        // 플레이어가 이미 정리됐으면 그냥 둔다
      }
    };
  }, [cancelFade, fadeVolume, handoff, player]);

  /*
   * (홈 쪽) 상세에 넘겨 둔 플레이어를 다시 가져온다.
   * 상세에서 하던 페이드는 멈추고, 이어 나오던 노래는 여기서 서서히 끈다.
   */
  const reclaimHandoff = useCallback(() => {
    const handedOff = handedOffRef.current;
    if (!handedOff) return;

    handedOffRef.current = null;
    clearPlaybackHandoff(handedOff);

    if (!handedOff.revoked) {
      handedOff.revoked = true;
      handedOff.onRevoke?.();
    }

    playbackStatusRef.current = player.currentStatus ?? null;
    stopAndReset();
  }, [player, stopAndReset]);

  /**
   * (홈 쪽) 지금 재생 중인 피드의 상세로 바로 들어갈 때 이동 직전에 부른다.
   * 그 피드를 재생(또는 불러오는) 중이 아니면 아무것도 넘기지 않는다.
   */
  const handOffPlayback = useCallback(
    feedId => {
      const nextFeedId = toIdKey(feedId);
      if (!nextFeedId || handedOffRef.current || loadedFeedIdRef.current !== nextFeedId) return;

      const isPlaying = playingFeedIdRef.current === nextFeedId;
      const isPending = pendingPlayFeedIdRef.current === nextFeedId;
      if (!isPlaying && !isPending) return;

      // 키우던 볼륨은 상세에서 이어서 키운다
      cancelFade();

      const nextHandoff = {
        feedId: nextFeedId,
        musicId: loadedMusicIdRef.current,
        player,
        pendingPlay: isPending,
        waitingForLoadTransition: waitingForLoadTransitionRef.current,
        revoked: false,
        onRevoke: null,
      };

      handedOffRef.current = nextHandoff;
      offerPlaybackHandoff(nextHandoff);

      // 이제 상세가 이 플레이어를 맡는다. 재생 버튼 모양은 돌아왔을 때 정리한다
      pendingPlayFeedIdRef.current = null;
      waitingForLoadTransitionRef.current = false;
      loadedFeedIdRef.current = null;
      loadedMusicIdRef.current = null;
      playbackStatusRef.current = null;
    },
    [cancelFade, player]
  );

  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', status => {
      // 다른 화면이 플레이어를 맡고 있는 동안에는 상태를 따라가지 않는다
      if (!canControlPlayer()) return;

      playbackStatusRef.current = status;

      // 들은 시간 기록 (shared/analytics/musicListenTracker.js)
      musicListenTracker.update(player, {
        playbackId: loadedFeedIdRef.current,
        musicId: loadedMusicIdRef.current,
        playing: Boolean(status.playing),
        currentTime: status.currentTime,
        didJustFinish: Boolean(status.didJustFinish),
      });

      if (status.error) {
        console.warn('음악 재생 중 오류가 발생했습니다.', status.error);
        cancelFade();
        stopAndReset();
        return;
      }

      const loadedFeedId = loadedFeedIdRef.current;
      if (!loadedFeedId) return;

      if (pendingPlayFeedIdRef.current === loadedFeedId) {
        if (!status.isLoaded) {
          waitingForLoadTransitionRef.current = false;
        } else if (!waitingForLoadTransitionRef.current) {
          pendingPlayFeedIdRef.current = null;
          playWithFadeIn();
        }
      }

      if (!status.isLoaded) {
        updatePlayingFeedId(null);
        return;
      }

      if (status.didJustFinish) {
        pendingPlayFeedIdRef.current = null;
        updatePlayingFeedId(null);
        return;
      }

      updatePlayingFeedId(status.playing && !isFadingOutRef.current ? loadedFeedId : null);
    });

    return () => {
      subscription.remove();
    };
  }, [canControlPlayer, cancelFade, player, playWithFadeIn, stopAndReset, updatePlayingFeedId]);

  useEffect(() => {
    return navigation.addListener('blur', () => {
      // 상세로 넘겨 준 재생은 멈추지 않는다
      if (handedOffRef.current) return;

      stopAndReset();
    });
  }, [navigation, stopAndReset]);

  // 상세에서 돌아오면 넘겨 둔 플레이어를 다시 가져온다
  useEffect(() => {
    return navigation.addListener('focus', reclaimHandoff);
  }, [navigation, reclaimHandoff]);

  const handleVisibleFeedChange = useCallback(
    feedId => {
      const nextFeedId = toIdKey(feedId);
      const loadedFeedId = loadedFeedIdRef.current;

      if (nextFeedId && loadedFeedId && loadedFeedId !== nextFeedId) {
        stopAndReset();
      }
    },
    [stopAndReset]
  );

  /**
   * @param {object} params
   * @param {string|number} params.feedId 재생 id (화면마다 피드 id · 'letter-{id}' · 애플뮤직 곡 id)
   * @param {string} params.previewUrl
   * @param {string|number} [params.musicId] 서버 음악 id (응답의 music.musicId). 넘기면 "재생해 본 음악" · 들은 시간을 기록한다.
   *   글쓰기 화면은 서버 음악 id 가 없어서 넘기지 않는다 (기록하지 않음)
   */
  const handlePressPlayback = useCallback(
    async ({ feedId, previewUrl, musicId }) => {
      // 홈이 다시 가져간 플레이어는 닫히는 상세에서 건드리지 않는다
      if (handoff?.revoked) return;

      reclaimHandoff();

      const nextFeedId = toIdKey(feedId);
      const nextPreviewUrl = normalizePreviewUrl(previewUrl);

      if (!nextFeedId || !nextPreviewUrl) return;

      const loadedFeedId = loadedFeedIdRef.current;
      const status = playbackStatusRef.current;

      const isSameLoadedFeed = loadedFeedId === nextFeedId;
      const isPending = pendingPlayFeedIdRef.current === nextFeedId;
      const isActuallyPlaying = isSameLoadedFeed && Boolean(status?.playing);

      if (isPending || isActuallyPlaying) {
        pendingPlayFeedIdRef.current = null;
        waitingForLoadTransitionRef.current = false;

        musicListenTracker.setEndReason(player, MUSIC_LISTEN_END_REASON.PAUSE);
        updatePlayingFeedId(null);
        void pauseWithFadeOut();
        return;
      }

      try {
        if (isSameLoadedFeed && status?.isLoaded) {
          const duration = Number.isFinite(status.duration) ? status.duration : player.duration || 0;
          const currentTime = Number.isFinite(status.currentTime) ? status.currentTime : player.currentTime || 0;

          const hasReachedEnd = duration > 0 && currentTime >= duration - PLAYBACK_END_TOLERANCE;

          if (hasReachedEnd) {
            await player.seekTo(0);
          }

          playWithFadeIn();
          return;
        }

        updatePlayingFeedId(null);
        musicListenTracker.setEndReason(player, MUSIC_LISTEN_END_REASON.SWITCH);

        // 다른 곡이 나오고 있으면 짧게 줄여 끊김 없이 넘긴다.
        // 줄이는 사이 다른 동작(또 다른 곡 · 정지)이 들어오면 이번 전환은 그만둔다
        const isFadedOut = await pauseWithFadeOut(SWITCH_FADE_OUT_DURATION);
        if (!isFadedOut) return;

        pendingPlayFeedIdRef.current = nextFeedId;
        waitingForLoadTransitionRef.current = Boolean(player.isLoaded);
        loadedFeedIdRef.current = nextFeedId;
        loadedMusicIdRef.current = toIdKey(musicId);

        player.replace(nextPreviewUrl);

        // 새 곡을 틀 때만 남긴다 (같은 곡 이어 듣기는 빼고). 추천 피드의 "재생해 본 음악"
        recordMusicPlay(loadedMusicIdRef.current);
      } catch (error) {
        console.warn('음악을 재생하지 못했습니다.', error);
        stopAndReset();
      }
    },
    [handoff, pauseWithFadeOut, playWithFadeIn, player, reclaimHandoff, stopAndReset, updatePlayingFeedId]
  );

  return {
    playingFeedId,
    handlePressPlayback,
    handleVisibleFeedChange,
    handOffPlayback,
    resetPlayback: stopAndReset,
  };
};

export default useFeedMusicPlayback;
