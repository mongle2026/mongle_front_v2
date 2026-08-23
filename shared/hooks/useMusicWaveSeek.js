import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { PanResponder } from 'react-native';
import {
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

const HORIZONTAL_DRAG_THRESHOLD = 3;
const VERTICAL_GESTURE_THRESHOLD = 6;
const ACCESSIBILITY_SEEK_STEP = 0.05;

const ACCESSIBILITY_ACTIONS = [
  {
    name: 'increment',
    label: '앞으로 이동',
  },
  {
    name: 'decrement',
    label: '뒤로 이동',
  },
];

const clampProgress = progress => {
  if (!Number.isFinite(progress)) return 0;

  return Math.min(
    Math.max(progress, 0),
    1,
  );
};

const getGestureDirection = ({
  dx,
  dy,
}) => {
  const horizontalDistance =
    Math.abs(dx);

  const verticalDistance =
    Math.abs(dy);

  if (
    verticalDistance >=
      VERTICAL_GESTURE_THRESHOLD &&
    verticalDistance >
      horizontalDistance
  ) {
    return 'vertical';
  }

  if (
    horizontalDistance >=
      HORIZONTAL_DRAG_THRESHOLD &&
    horizontalDistance >=
      verticalDistance
  ) {
    return 'horizontal';
  }

  return 'tap';
};

const isSharedValue = value =>
  value != null &&
  typeof value === 'object' &&
  'value' in value;

const useMusicWaveSeek = ({
  playbackProgress,
  enabled = false,
  onSeek,
}) => {
  const waveWidthRef = useRef(0);
  const pendingProgressRef =
    useRef(0);
  const startProgressRef =
    useRef(0);

  const gestureDirectionRef =
    useRef('tap');

  /*
   * 숫자 progress가 넘어오는 경우도
   * 안전하게 지원하기 위한 fallback입니다.
   *
   * 현재 Feed에서는 SharedValue가 넘어옵니다.
   */
  const fallbackPlaybackProgress =
    useSharedValue(0);

  const seekProgress =
    useSharedValue(0);

  const isSeeking =
    useSharedValue(false);

  const [waveWidth, setWaveWidth] =
    useState(0);

  const playbackProgressValue =
    isSharedValue(
      playbackProgress,
    )
      ? playbackProgress
      : fallbackPlaybackProgress;

  useEffect(() => {
    if (
      isSharedValue(
        playbackProgress,
      )
    ) {
      return;
    }

    fallbackPlaybackProgress.value =
      clampProgress(
        playbackProgress,
      );
  }, [
    fallbackPlaybackProgress,
    playbackProgress,
  ]);

  const canSeek =
    enabled &&
    typeof onSeek === 'function';

  /*
   * 실제 재생 위치와 사용자가 드래그 중인 위치 중
   * 현재 화면에 보여줘야 할 값을 결정합니다.
   */
  const displayedProgress =
    useDerivedValue(() => {
      return isSeeking.value
        ? seekProgress.value
        : playbackProgressValue.value;
    });

  useEffect(() => {
    if (canSeek) return;

    isSeeking.value = false;
    gestureDirectionRef.current =
      'tap';
  }, [
    canSeek,
    isSeeking,
  ]);

  const handleLayout =
    useCallback(event => {
      const nextWidth =
        Math.round(
          event.nativeEvent.layout
            .width,
        );

      waveWidthRef.current =
        nextWidth;

      setWaveWidth(
        currentWidth =>
          currentWidth ===
          nextWidth
            ? currentWidth
            : nextWidth,
      );
    }, []);

  const getEventProgress =
    useCallback(event => {
      const width =
        waveWidthRef.current;

      const locationX =
        event.nativeEvent
          .locationX;

      if (
        width <= 0 ||
        !Number.isFinite(
          locationX,
        )
      ) {
        return null;
      }

      return clampProgress(
        locationX / width,
      );
    }, []);

  const previewSeek =
    useCallback(
      progress => {
        const nextProgress =
          clampProgress(
            progress,
          );

        pendingProgressRef.current =
          nextProgress;

        seekProgress.value =
          nextProgress;

        isSeeking.value = true;
      },
      [
        isSeeking,
        seekProgress,
      ],
    );

  const cancelSeek =
    useCallback(() => {
      isSeeking.value = false;

      gestureDirectionRef.current =
        'tap';
    }, [isSeeking]);

  const commitSeek =
    useCallback(
      progress => {
        if (!canSeek) return;

        const nextProgress =
          clampProgress(
            progress,
          );

        pendingProgressRef.current =
          nextProgress;

        /*
         * 터치한 즉시 파형 위치를 변경합니다.
         * React state는 건드리지 않습니다.
         */
        playbackProgressValue.value =
          nextProgress;

        seekProgress.value =
          nextProgress;

        isSeeking.value = false;

        gestureDirectionRef.current =
          'tap';

        onSeek(nextProgress);
      },
      [
        canSeek,
        isSeeking,
        onSeek,
        playbackProgressValue,
        seekProgress,
      ],
    );

  const panResponder =
    useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder:
            () => canSeek,

          onPanResponderGrant:
            event => {
              event.stopPropagation?.();

              gestureDirectionRef.current =
                'tap';

              const eventProgress =
                getEventProgress(
                  event,
                );

              const startProgress =
                eventProgress ??
                playbackProgressValue.value;

              startProgressRef.current =
                startProgress;

              pendingProgressRef.current =
                startProgress;
            },

          onPanResponderMove: (
            event,
            gestureState,
          ) => {
            const direction =
              getGestureDirection(
                gestureState,
              );

            if (
              direction ===
              'vertical'
            ) {
              gestureDirectionRef.current =
                direction;

              isSeeking.value =
                false;

              return;
            }

            if (
              direction ===
              'horizontal'
            ) {
              gestureDirectionRef.current =
                direction;

              const eventProgress =
                getEventProgress(
                  event,
                );

              if (
                eventProgress !==
                null
              ) {
                previewSeek(
                  eventProgress,
                );
              }
            }
          },

          onPanResponderRelease:
            event => {
              event.stopPropagation?.();

              if (
                gestureDirectionRef.current ===
                'vertical'
              ) {
                cancelSeek();
                return;
              }

              if (
                gestureDirectionRef.current ===
                'horizontal'
              ) {
                commitSeek(
                  pendingProgressRef.current,
                );

                return;
              }

              commitSeek(
                getEventProgress(
                  event,
                ) ??
                  startProgressRef.current,
              );
            },

          onPanResponderTerminate:
            cancelSeek,

          onPanResponderTerminationRequest:
            (
              _,
              gestureState,
            ) => {
              const isVertical =
                getGestureDirection(
                  gestureState,
                ) ===
                'vertical';

              if (isVertical) {
                gestureDirectionRef.current =
                  'vertical';

                isSeeking.value =
                  false;
              }

              return isVertical;
            },

          onShouldBlockNativeResponder:
            () => false,
        }),
      [
        canSeek,
        cancelSeek,
        commitSeek,
        getEventProgress,
        isSeeking,
        playbackProgressValue,
        previewSeek,
      ],
    );

  const handleAccessibilityAction =
    useCallback(
      event => {
        if (!canSeek) return;

        const currentProgress =
          playbackProgressValue.value;

        const actionName =
          event.nativeEvent
            .actionName;

        if (
          actionName ===
          'increment'
        ) {
          commitSeek(
            currentProgress +
              ACCESSIBILITY_SEEK_STEP,
          );
        } else if (
          actionName ===
          'decrement'
        ) {
          commitSeek(
            currentProgress -
              ACCESSIBILITY_SEEK_STEP,
          );
        }
      },
      [
        canSeek,
        commitSeek,
        playbackProgressValue,
      ],
    );

  return {
    waveWidth,
    displayedProgress,
    handleLayout,
    panHandlers:
      panResponder.panHandlers,
    accessibilityActions:
      ACCESSIBILITY_ACTIONS,
    handleAccessibilityAction,
  };
};

export default useMusicWaveSeek;