import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';

const PLAYBACK_END_TOLERANCE = 0.1;

const normalizeFeedId = feedId => (feedId === null || feedId === undefined ? null : String(feedId));

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

  const updatePlayingFeedId = useCallback(nextFeedId => {
    if (playingFeedIdRef.current === nextFeedId) return;

    playingFeedIdRef.current = nextFeedId;
    setPlayingFeedId(nextFeedId);
  }, []);

  const stopAndReset = useCallback(() => {
    pendingPlayFeedIdRef.current = null;
    waitingForLoadTransitionRef.current = false;
    playbackStatusRef.current = null;

    player.pause();

    loadedFeedIdRef.current = null;

    updatePlayingFeedId(null);
  }, [player, updatePlayingFeedId]);

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
        updatePlayingFeedId(null);
        return;
      }

      if (status.didJustFinish) {
        pendingPlayFeedIdRef.current = null;
        updatePlayingFeedId(null);
        return;
      }

      updatePlayingFeedId(status.playing ? loadedFeedId : null);
    });

    return () => {
      subscription.remove();
    };
  }, [player, stopAndReset, updatePlayingFeedId]);

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

        player.pause();
        updatePlayingFeedId(null);
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

          player.play();
          return;
        }

        player.pause();
        updatePlayingFeedId(null);

        pendingPlayFeedIdRef.current = nextFeedId;
        waitingForLoadTransitionRef.current = Boolean(player.isLoaded);
        loadedFeedIdRef.current = nextFeedId;

        player.replace(nextPreviewUrl);
      } catch (error) {
        console.warn('음악을 재생하지 못했습니다.', error);
        stopAndReset();
      }
    },
    [player, stopAndReset, updatePlayingFeedId]
  );

  return {
    playingFeedId,
    handlePressPlayback,
    handleVisibleFeedChange,
    resetPlayback: stopAndReset,
  };
};

export default useFeedMusicPlayback;