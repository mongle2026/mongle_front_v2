import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';

import { toIdKey } from '../utils/id';

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

const useFeedMusicPlayback = ({ navigation }) => {
  const player = useAudioPlayer(null);

  const loadedFeedIdRef = useRef(null);
  const pendingPlayFeedIdRef = useRef(null);
  const waitingForLoadTransitionRef = useRef(false);
  const playbackStatusRef = useRef(null);
  const playingFeedIdRef = useRef(null);

  const [playingFeedId, setPlayingFeedId] = useState(null);

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

  const updatePlayingFeedId = useCallback(nextFeedId => {
    if (playingFeedIdRef.current === nextFeedId) return;

    playingFeedIdRef.current = nextFeedId;
    setPlayingFeedId(nextFeedId);
  }, []);

  const stopAndReset = useCallback(() => {
    pendingPlayFeedIdRef.current = null;
    waitingForLoadTransitionRef.current = false;
    void pauseWithFadeOut();
    playbackStatusRef.current = null;

    loadedFeedIdRef.current = null;

    updatePlayingFeedId(null);
  }, [pauseWithFadeOut, updatePlayingFeedId]);

  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', status => {
      playbackStatusRef.current = status;

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
  }, [cancelFade, player, playWithFadeIn, stopAndReset, updatePlayingFeedId]);

  useEffect(() => {
    return navigation.addListener('blur', stopAndReset);
  }, [navigation, stopAndReset]);

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

  const handlePressPlayback = useCallback(
    async ({ feedId, previewUrl }) => {
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

        // 다른 곡이 나오고 있으면 짧게 줄여 끊김 없이 넘긴다.
        // 줄이는 사이 다른 동작(또 다른 곡 · 정지)이 들어오면 이번 전환은 그만둔다
        const isFadedOut = await pauseWithFadeOut(SWITCH_FADE_OUT_DURATION);
        if (!isFadedOut) return;

        pendingPlayFeedIdRef.current = nextFeedId;
        waitingForLoadTransitionRef.current = Boolean(player.isLoaded);
        loadedFeedIdRef.current = nextFeedId;

        player.replace(nextPreviewUrl);
      } catch (error) {
        console.warn('음악을 재생하지 못했습니다.', error);
        stopAndReset();
      }
    },
    [pauseWithFadeOut, playWithFadeIn, player, stopAndReset, updatePlayingFeedId]
  );

  return {
    playingFeedId,
    handlePressPlayback,
    handleVisibleFeedChange,
    resetPlayback: stopAndReset,
  };
};

export default useFeedMusicPlayback;