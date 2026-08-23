import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import {
  cancelAnimation,
  Easing,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const PLAYBACK_END_TOLERANCE = 0.1;
const PLAYBACK_UPDATE_INTERVAL = 250;

const normalizeFeedId = feedId =>
  feedId === null || feedId === undefined
    ? null
    : String(feedId);

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

  return clampProgress(
    currentTime / duration,
  );
};

const useFeedMusicPlayback = ({ navigation }) => {
  const player = useAudioPlayer(null, {
    updateInterval: PLAYBACK_UPDATE_INTERVAL,
  });

  const loadedFeedIdRef = useRef(null);

  const pendingPlayFeedIdRef = useRef(null);
  const waitingForLoadTransitionRef = useRef(false);

  const playbackStatusRef = useRef(null);
  const playingFeedIdRef = useRef(null);

  const isSeekingRef = useRef(false);
  const seekRequestIdRef = useRef(0);

  const [playingFeedId, setPlayingFeedId] =
    useState(null);

  /*
   * 진행률은 React state로 관리하지 않습니다.
   *
   * 값이 바뀌어도 FeedHomeScreen / FlatList /
   * PostCard가 재렌더링되지 않도록 SharedValue로
   * 관리합니다.
   */
  const playbackProgress = useSharedValue(0);

  const updatePlayingFeedId = useCallback(
    nextFeedId => {
      if (
        playingFeedIdRef.current ===
        nextFeedId
      ) {
        return;
      }

      playingFeedIdRef.current =
        nextFeedId;

      setPlayingFeedId(nextFeedId);
    },
    [],
  );

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

    player.pause();

    loadedFeedIdRef.current = null;

    updatePlayingFeedId(null);
    resetProgress();
  }, [
    cancelPendingSeek,
    player,
    resetProgress,
    updatePlayingFeedId,
  ]);

  /*
   * expo-audio의 상태 이벤트는
   *
   * - 실제 재생 여부
   * - 로딩 완료 여부
   * - 현재 재생 위치
   * - 재생 종료
   *
   * 를 판단하는 용도로 사용합니다.
   *
   * 파형 자체는 SharedValue + withTiming으로
   * UI thread에서 부드럽게 움직입니다.
   */
  useEffect(() => {
    const subscription = player.addListener(
      'playbackStatusUpdate',
      status => {
        playbackStatusRef.current = status;

        if (status.error) {
          console.warn(
            '음악 재생 중 오류가 발생했습니다.',
            status.error,
          );

          stopAndReset();
          return;
        }

        const loadedFeedId =
          loadedFeedIdRef.current;

        if (!loadedFeedId) return;

        /*
         * 새로운 source를 replace한 경우
         * 실제 로딩 완료 후 재생합니다.
         */
        if (
          pendingPlayFeedIdRef.current ===
          loadedFeedId
        ) {
          if (!status.isLoaded) {
            waitingForLoadTransitionRef.current =
              false;
          } else if (
            !waitingForLoadTransitionRef.current
          ) {
            pendingPlayFeedIdRef.current =
              null;

            player.play();
          }
        }

        if (!status.isLoaded) {
          updatePlayingFeedId(null);
          return;
        }

        const currentProgress =
          status.didJustFinish
            ? 1
            : getPlaybackProgress(status);

        /*
         * seek 중에는 사용자가 지정한 위치를
         * 파형에 그대로 보여줘야 하므로
         * 상태 이벤트가 덮어쓰지 않습니다.
         */
        if (!isSeekingRef.current) {
          cancelAnimation(playbackProgress);

          if (
            status.playing &&
            !status.didJustFinish &&
            Number.isFinite(
              status.duration,
            ) &&
            status.duration > 0
          ) {
            /*
             * 다음 status 이벤트가 올 때까지
             * 예상되는 진행 위치를 계산합니다.
             */
            const intervalProgress =
              (PLAYBACK_UPDATE_INTERVAL /
                1000) /
              status.duration;

            const targetProgress =
              clampProgress(
                currentProgress +
                  intervalProgress,
              );

            /*
             * 현재 실제 위치에서
             * 다음 예상 위치까지 UI thread에서
             * 선형으로 움직입니다.
             */
            playbackProgress.value =
              currentProgress;

            playbackProgress.value =
              withTiming(
                targetProgress,
                {
                  duration:
                    PLAYBACK_UPDATE_INTERVAL,
                  easing: Easing.linear,
                },
              );
          } else {
            playbackProgress.value =
              currentProgress;
          }
        }

        if (status.didJustFinish) {
          pendingPlayFeedIdRef.current =
            null;

          cancelAnimation(
            playbackProgress,
          );

          playbackProgress.value = 1;

          updatePlayingFeedId(null);

          return;
        }

        updatePlayingFeedId(
          status.playing
            ? loadedFeedId
            : null,
        );
      },
    );

    return () => {
      subscription.remove();
    };
  }, [
    playbackProgress,
    player,
    stopAndReset,
    updatePlayingFeedId,
  ]);

  /*
   * 상세 화면 이동 등으로 현재 화면을 벗어나면
   * 재생을 종료합니다.
   */
  useEffect(() => {
    return navigation.addListener(
      'blur',
      stopAndReset,
    );
  }, [
    navigation,
    stopAndReset,
  ]);

  const handleVisibleFeedChange =
    useCallback(
      feedId => {
        const nextFeedId =
          normalizeFeedId(feedId);

        const loadedFeedId =
          loadedFeedIdRef.current;

        if (
          nextFeedId &&
          loadedFeedId &&
          loadedFeedId !== nextFeedId
        ) {
          stopAndReset();
        }
      },
      [stopAndReset],
    );

  const handlePressPlayback =
    useCallback(
      async ({
        feedId,
        previewUrl,
      }) => {
        const nextFeedId =
          normalizeFeedId(feedId);

        const nextPreviewUrl =
          normalizePreviewUrl(
            previewUrl,
          );

        if (
          !nextFeedId ||
          !nextPreviewUrl
        ) {
          return;
        }

        const loadedFeedId =
          loadedFeedIdRef.current;

        const status =
          playbackStatusRef.current;

        const isSameLoadedFeed =
          loadedFeedId === nextFeedId;

        const isPending =
          pendingPlayFeedIdRef.current ===
          nextFeedId;

        const isActuallyPlaying =
          isSameLoadedFeed &&
          Boolean(status?.playing);

        /*
         * 아직 로딩 중인 곡을 다시 누르거나
         * 현재 재생 중인 곡을 다시 누르면
         * 일시정지합니다.
         */
        if (
          isPending ||
          isActuallyPlaying
        ) {
          pendingPlayFeedIdRef.current =
            null;

          waitingForLoadTransitionRef.current =
            false;

          player.pause();

          updatePlayingFeedId(null);

          return;
        }

        try {
          cancelPendingSeek();

          /*
           * 이미 같은 곡이 로드되어 있다면
           * replace를 다시 하지 않습니다.
           */
          if (
            isSameLoadedFeed &&
            status?.isLoaded
          ) {
            const duration =
              Number.isFinite(
                status.duration,
              )
                ? status.duration
                : player.duration || 0;

            const currentTime =
              Number.isFinite(
                status.currentTime,
              )
                ? status.currentTime
                : player.currentTime || 0;

            const hasReachedEnd =
              duration > 0 &&
              currentTime >=
                duration -
                  PLAYBACK_END_TOLERANCE;

            if (hasReachedEnd) {
              await player.seekTo(0);

              resetProgress();
            }

            player.play();

            return;
          }

          /*
           * 새로운 곡.
           *
           * replace
           * → 실제 load 완료
           * → playbackStatusUpdate
           * → player.play()
           */
          player.pause();

          updatePlayingFeedId(null);
          resetProgress();

          pendingPlayFeedIdRef.current =
            nextFeedId;

          waitingForLoadTransitionRef.current =
            Boolean(player.isLoaded);

          loadedFeedIdRef.current =
            nextFeedId;

          player.replace(
            nextPreviewUrl,
          );
        } catch (error) {
          console.warn(
            '음악을 재생하지 못했습니다.',
            error,
          );

          stopAndReset();
        }
      },
      [
        cancelPendingSeek,
        player,
        resetProgress,
        stopAndReset,
        updatePlayingFeedId,
      ],
    );

  const handleSeekPlayback =
    useCallback(
      async ({
        feedId,
        progress,
      }) => {
        const nextFeedId =
          normalizeFeedId(feedId);

        const nextProgress =
          clampProgress(progress);

        if (
          !nextFeedId ||
          loadedFeedIdRef.current !==
            nextFeedId
        ) {
          return;
        }

        const status =
          playbackStatusRef.current;

        const duration =
          Number.isFinite(
            status?.duration,
          ) &&
          status.duration > 0
            ? status.duration
            : player.duration || 0;

        if (duration <= 0) return;

        const maximumSeekTime =
          duration >
          PLAYBACK_END_TOLERANCE
            ? duration -
              PLAYBACK_END_TOLERANCE
            : duration;

        const targetTime =
          Math.min(
            duration *
              nextProgress,
            maximumSeekTime,
          );

        const targetProgress =
          clampProgress(
            targetTime /
              duration,
          );

        const requestId =
          seekRequestIdRef.current +
          1;

        seekRequestIdRef.current =
          requestId;

        isSeekingRef.current = true;

        cancelAnimation(
          playbackProgress,
        );

        playbackProgress.value =
          targetProgress;

        const wasPlaying =
          Boolean(status?.playing);

        try {
          if (
            Platform.OS === 'ios'
          ) {
            await player.seekTo(
              targetTime,
              0,
              0,
            );
          } else {
            await player.seekTo(
              targetTime,
            );
          }

          /*
           * iOS에서 seek 후 재생이 멈추는 경우를
           * 방지하기 위해 기존에 실제 재생 중이었다면
           * play를 다시 보장합니다.
           */
          if (
            wasPlaying &&
            loadedFeedIdRef.current ===
              nextFeedId
          ) {
            player.play();
          }
        } catch (error) {
          console.warn(
            '음악 재생 위치를 변경하지 못했습니다.',
            error,
          );
        } finally {
          if (
            seekRequestIdRef.current ===
            requestId
          ) {
            isSeekingRef.current =
              false;
          }
        }
      },
      [
        playbackProgress,
        player,
      ],
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