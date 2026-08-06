import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';

const PLAYBACK_END_TOLERANCE = 0.1;
const PLAYBACK_UPDATE_INTERVAL = 100;

const normalizeFeedId = feedId =>
  feedId === null || feedId === undefined ? null : String(feedId);

const normalizePreviewUrl = previewUrl => {
  if (typeof previewUrl !== 'string') return null;
  return previewUrl.trim() || null;
};

const clampProgress = progress => {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(Math.max(progress, 0), 1);
};

const getPlaybackProgress = status => {
  const currentTime = Number.isFinite(status.currentTime)
    ? Math.max(status.currentTime, 0)
    : 0;
  const duration = Number.isFinite(status.duration)
    ? Math.max(status.duration, 0)
    : 0;

  if (duration <= 0) return 0;
  return clampProgress(currentTime / duration);
};

const useFeedMusicPlayback = ({ navigation }) => {
  const player = useAudioPlayer(null, {
    updateInterval: PLAYBACK_UPDATE_INTERVAL,
  });

  const loadedFeedIdRef = useRef(null);
  const durationRef = useRef(0);
  const isSeekingRef = useRef(false);
  const seekRequestIdRef = useRef(0);
  const shouldBePlayingRef = useRef(false);

  const [playingFeedId, setPlayingFeedId] = useState(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  const cancelPendingSeek = useCallback(() => {
    seekRequestIdRef.current += 1;
    isSeekingRef.current = false;
  }, []);

  const stopAndReset = useCallback(() => {
    cancelPendingSeek();
    shouldBePlayingRef.current = false;
    player.pause();
    loadedFeedIdRef.current = null;
    durationRef.current = 0;
    setPlayingFeedId(null);
    setPlaybackProgress(0);
  }, [cancelPendingSeek, player]);

  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', status => {
      if (status.error) {
        console.warn('음악 재생 중 오류가 발생했습니다.', status.error);
        stopAndReset();
        return;
      }

      const loadedFeedId = loadedFeedIdRef.current;
      if (!loadedFeedId) return;

      durationRef.current = Number.isFinite(status.duration)
        ? Math.max(status.duration, 0)
        : 0;

      if (!isSeekingRef.current) {
        setPlaybackProgress(
          status.didJustFinish ? 1 : getPlaybackProgress(status),
        );
      }

      if (status.didJustFinish) {
        shouldBePlayingRef.current = false;
        setPlayingFeedId(null);
        return;
      }

      setPlayingFeedId(
        shouldBePlayingRef.current
          ? loadedFeedId
          : null,
      );
    });

    return () => subscription.remove();
  }, [player, stopAndReset]);

  useEffect(() => {
    return navigation.addListener('blur', stopAndReset);
  }, [navigation, stopAndReset]);

  const handleVisibleFeedChange = useCallback(feedId => {
    const nextFeedId = normalizeFeedId(feedId);
    const loadedFeedId = loadedFeedIdRef.current;

    if (nextFeedId && loadedFeedId && loadedFeedId !== nextFeedId) {
      stopAndReset();
    }
  }, [stopAndReset]);

  const handlePressPlayback = useCallback(async ({ feedId, previewUrl }) => {
    const nextFeedId = normalizeFeedId(feedId);
    const nextPreviewUrl = normalizePreviewUrl(previewUrl);

    if (!nextFeedId || !nextPreviewUrl) return;

    const isSameLoadedFeed = loadedFeedIdRef.current === nextFeedId;
    const isCurrentlyPlaying =
      isSameLoadedFeed && shouldBePlayingRef.current;

    if (isCurrentlyPlaying) {
      cancelPendingSeek();
      shouldBePlayingRef.current = false;
      player.pause();
      setPlayingFeedId(null);
      return;
    }

    try {
      cancelPendingSeek();

      if (isSameLoadedFeed) {
        const duration = Math.max(durationRef.current, player.duration || 0);
        const hasReachedEnd =
          duration > 0 &&
          player.currentTime >= duration - PLAYBACK_END_TOLERANCE;

        if (hasReachedEnd) {
          await player.seekTo(0);
          setPlaybackProgress(0);
        }
      } else {
        player.pause();
        durationRef.current = 0;
        setPlaybackProgress(0);
        loadedFeedIdRef.current = nextFeedId;
        player.replace(nextPreviewUrl);
      }

      shouldBePlayingRef.current = true;
      setPlayingFeedId(nextFeedId);
      player.play();
    } catch (error) {
      console.warn(
        isSameLoadedFeed
          ? '음악을 다시 재생하지 못했습니다.'
          : '음악을 재생하지 못했습니다.',
        error,
      );

      stopAndReset();
    }
  }, [cancelPendingSeek, player, stopAndReset]);

  const handleSeekPlayback = useCallback(async ({ feedId, progress }) => {
    const nextFeedId = normalizeFeedId(feedId);
    const nextProgress = clampProgress(progress);

    if (!nextFeedId || loadedFeedIdRef.current !== nextFeedId) return;

    const duration = Math.max(durationRef.current, player.duration || 0);
    if (duration <= 0) return;

    const maximumSeekTime =
      duration > PLAYBACK_END_TOLERANCE
        ? duration - PLAYBACK_END_TOLERANCE
        : duration;

    const targetTime = Math.min(
      duration * nextProgress,
      maximumSeekTime,
    );

    const targetProgress = clampProgress(targetTime / duration);
    const requestId = seekRequestIdRef.current + 1;

    seekRequestIdRef.current = requestId;
    isSeekingRef.current = true;
    setPlaybackProgress(targetProgress);

    try {
      await player.seekTo(targetTime);
    } catch (error) {
      console.warn('음악 재생 위치를 변경하지 못했습니다.', error);

      if (seekRequestIdRef.current === requestId) {
        setPlaybackProgress(
          duration > 0
            ? clampProgress(player.currentTime / duration)
            : 0,
        );
      }
    } finally {
      if (seekRequestIdRef.current === requestId) {
        isSeekingRef.current = false;
      }
    }
  }, [player]);

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