import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { cancelAnimation, Easing, useSharedValue, withTiming } from 'react-native-reanimated';

const PLAYBACK_END_TOLERANCE = 0.1;
const PLAYBACK_UPDATE_INTERVAL = 250;

const normalizeFeedId = feedId => (feedId === null || feedId === undefined ? null : String(feedId));

const normalizePreviewUrl = previewUrl => {
  if (typeof previewUrl !== 'string') return null;
  return previewUrl.trim() || null;
};

const clampProgress = progress => {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(Math.max(progress, 0), 1);
};

const getPlaybackProgress = status => {
  const currentTime = Number.isFinite(status.currentTime) ? Math.max(status.currentTime, 0) : 0;
  const duration = Number.isFinite(status.duration) ? Math.max(status.duration, 0) : 0;

  if (duration <= 0) return 0;
  return clampProgress(currentTime / duration);
};

const useFeedMusicPlayback = ({ navigation }) => {
  const player = useAudioPlayer(null, { updateInterval: PLAYBACK_UPDATE_INTERVAL });

  const loadedFeedIdRef = useRef(null);
  const pendingPlayFeedIdRef = useRef(null);
  const waitingForLoadTransitionRef = useRef(false);
  const playbackStatusRef = useRef(null);
  const playingFeedIdRef = useRef(null);
  const preservePlayingFeedIdRef = useRef(null);
  const isSeekingRef = useRef(false);
  const seekRequestIdRef = useRef(0);

  const [playingFeedId, setPlayingFeedId] = useState(null);

  const playbackProgress = useSharedValue(0);

  const updatePlayingFeedId = useCallback(nextFeedId => {
    if (playingFeedIdRef.current === nextFeedId) return;

    playingFeedIdRef.current = nextFeedId;
    setPlayingFeedId(nextFeedId);
  }, []);

  const resetProgress = useCallback(() => {
    cancelAnimation(playbackProgress);
    playbackProgress.value = 0;
  }, [playbackProgress]);

  const cancelPendingSeek = useCallback(() => {
    seekRequestIdRef.current += 1;
    isSeekingRef.current = false;
  }, []);

  const stopAndReset = useCallback(() => {
    cancelPendingSeek();

    pendingPlayFeedIdRef.current = null;
    waitingForLoadTransitionRef.current = false;
    playbackStatusRef.current = null;
    preservePlayingFeedIdRef.current = null;

    player.pause();

    loadedFeedIdRef.current = null;

    updatePlayingFeedId(null);
    resetProgress();
  }, [cancelPendingSeek, player, resetProgress, updatePlayingFeedId]);

  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', status => {
      playbackStatusRef.current = status;

      if (status.error) {
        console.warn('음악 재생 중 오류가 발생했습니다.', status.error);
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
          player.play();
        }
      }

      if (!status.isLoaded) {
        const shouldPreservePlaying = Platform.OS === 'android' && preservePlayingFeedIdRef.current === loadedFeedId;
        if (!shouldPreservePlaying) {
          updatePlayingFeedId(null);
        }
        return;
      }

      const currentProgress = status.didJustFinish ? 1 : getPlaybackProgress(status);

      if (!isSeekingRef.current) {
        cancelAnimation(playbackProgress);

        if (status.playing && !status.didJustFinish && Number.isFinite(status.duration) && status.duration > 0) {
          const intervalProgress = (PLAYBACK_UPDATE_INTERVAL / 1000) / status.duration;
          const targetProgress = clampProgress(currentProgress + intervalProgress);

          playbackProgress.value = currentProgress;
          playbackProgress.value = withTiming(targetProgress, {
            duration: PLAYBACK_UPDATE_INTERVAL,
            easing: Easing.linear,
          });
        } else {
          playbackProgress.value = currentProgress;
        }
      }

      if (status.didJustFinish) {
        pendingPlayFeedIdRef.current = null;
        preservePlayingFeedIdRef.current = null;

        cancelAnimation(playbackProgress);
        playbackProgress.value = 1;

        updatePlayingFeedId(null);
        return;
      }

      const shouldPreservePlaying = Platform.OS === 'android' && preservePlayingFeedIdRef.current === loadedFeedId;

      if (status.playing) {
        if (shouldPreservePlaying) {
          preservePlayingFeedIdRef.current = null;
        }
        updatePlayingFeedId(loadedFeedId);
        return;
      }

      if (!shouldPreservePlaying) {
        updatePlayingFeedId(null);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [playbackProgress, player, stopAndReset, updatePlayingFeedId]);

  useEffect(() => {
    return navigation.addListener('blur', stopAndReset);
  }, [navigation, stopAndReset]);

  const handleVisibleFeedChange = useCallback(
    feedId => {
      const nextFeedId = normalizeFeedId(feedId);
      const loadedFeedId = loadedFeedIdRef.current;

      if (nextFeedId && loadedFeedId && loadedFeedId !== nextFeedId) {
        stopAndReset();
      }
    },
    [stopAndReset]
  );

  const handlePressPlayback = useCallback(
    async ({ feedId, previewUrl }) => {
      const nextFeedId = normalizeFeedId(feedId);
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
        preservePlayingFeedIdRef.current = null;

        player.pause();
        updatePlayingFeedId(null);
        return;
      }

      try {
        cancelPendingSeek();
        preservePlayingFeedIdRef.current = null;

        if (isSameLoadedFeed && status?.isLoaded) {
          const duration = Number.isFinite(status.duration) ? status.duration : player.duration || 0;
          const currentTime = Number.isFinite(status.currentTime) ? status.currentTime : player.currentTime || 0;

          const hasReachedEnd = duration > 0 && currentTime >= duration - PLAYBACK_END_TOLERANCE;

          if (hasReachedEnd) {
            await player.seekTo(0);
            resetProgress();
          }

          player.play();
          return;
        }

        player.pause();
        updatePlayingFeedId(null);
        resetProgress();

        pendingPlayFeedIdRef.current = nextFeedId;
        waitingForLoadTransitionRef.current = Boolean(player.isLoaded);
        loadedFeedIdRef.current = nextFeedId;

        player.replace(nextPreviewUrl);
      } catch (error) {
        console.warn('음악을 재생하지 못했습니다.', error);
        stopAndReset();
      }
    },
    [cancelPendingSeek, player, resetProgress, stopAndReset, updatePlayingFeedId]
  );

  const handleSeekPlayback = useCallback(
    async ({ feedId, progress }) => {
      const nextFeedId = normalizeFeedId(feedId);
      const nextProgress = clampProgress(progress);

      if (!nextFeedId || loadedFeedIdRef.current !== nextFeedId) return;

      const status = playbackStatusRef.current;
      const duration = Number.isFinite(status?.duration) && status.duration > 0 ? status.duration : player.duration || 0;

      if (duration <= 0) return;

      const maximumSeekTime = duration > PLAYBACK_END_TOLERANCE ? duration - PLAYBACK_END_TOLERANCE : duration;
      const targetTime = Math.min(duration * nextProgress, maximumSeekTime);
      const targetProgress = clampProgress(targetTime / duration);

      const requestId = seekRequestIdRef.current + 1;
      seekRequestIdRef.current = requestId;
      isSeekingRef.current = true;

      cancelAnimation(playbackProgress);
      playbackProgress.value = targetProgress;

      const wasPlaying = Boolean(status?.playing) || playingFeedIdRef.current === nextFeedId;

      if (Platform.OS === 'android' && wasPlaying) {
        preservePlayingFeedIdRef.current = nextFeedId;
      }

      try {
        if (Platform.OS === 'ios') {
          await player.seekTo(targetTime, 0, 0);
        } else {
          await player.seekTo(targetTime);
        }

        if (wasPlaying && loadedFeedIdRef.current === nextFeedId) {
          player.play();
        }
      } catch (error) {
        if (preservePlayingFeedIdRef.current === nextFeedId) {
          preservePlayingFeedIdRef.current = null;
        }
        console.warn('음악 재생 위치를 변경하지 못했습니다.', error);
      } finally {
        if (seekRequestIdRef.current === requestId) {
          isSeekingRef.current = false;
        }
      }
    },
    [playbackProgress, player]
  );

  return {
    playingFeedId,
    playbackProgress,
    handlePressPlayback,
    handleSeekPlayback,
    handleVisibleFeedChange,
    resetPlayback: stopAndReset,
  };
};

export default useFeedMusicPlayback;