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

const getPlaybackProgress = status => {
  const currentTime = Number.isFinite(status.currentTime)
    ? Math.max(status.currentTime, 0)
    : 0;
  const duration = Number.isFinite(status.duration)
    ? Math.max(status.duration, 0)
    : 0;

  if (duration <= 0) return 0;
  return Math.min(Math.max(currentTime / duration, 0), 1);
};

const useFeedMusicPlayback = ({ navigation }) => {
  const player = useAudioPlayer(null, {
    updateInterval: PLAYBACK_UPDATE_INTERVAL,
  });

  const loadedFeedIdRef = useRef(null);
  const [playingFeedId, setPlayingFeedId] = useState(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  const stopAndReset = useCallback(() => {
    player.pause();
    loadedFeedIdRef.current = null;
    setPlayingFeedId(null);
    setPlaybackProgress(0);
  }, [player]);

  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', status => {
      if (status.error) {
        console.warn('음악 재생 중 오류가 발생했습니다.', status.error);
        stopAndReset();
        return;
      }

      const loadedFeedId = loadedFeedIdRef.current;
      if (!loadedFeedId) return;

      setPlaybackProgress(
        status.didJustFinish ? 1 : getPlaybackProgress(status),
      );

      setPlayingFeedId(
        status.playing && !status.didJustFinish
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

    if (isSameLoadedFeed && player.playing) {
      player.pause();
      setPlayingFeedId(null);
      return;
    }

    try {
      if (isSameLoadedFeed) {
        const hasReachedEnd =
          player.duration > 0 &&
          player.currentTime >= player.duration - PLAYBACK_END_TOLERANCE;

        if (hasReachedEnd) {
          await player.seekTo(0);
          setPlaybackProgress(0);
        }
      } else {
        player.pause();
        setPlaybackProgress(0);
        player.replace(nextPreviewUrl);
        loadedFeedIdRef.current = nextFeedId;
      }

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
  }, [player, stopAndReset]);

  return {
    playingFeedId,
    playbackProgress,
    handlePressPlayback,
    handleVisibleFeedChange,
    resetPlayback: stopAndReset,
  };
};

export default useFeedMusicPlayback;