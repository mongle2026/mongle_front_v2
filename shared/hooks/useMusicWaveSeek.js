import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder } from 'react-native';

const HORIZONTAL_DRAG_THRESHOLD = 3;
const VERTICAL_GESTURE_THRESHOLD = 6;
const ACCESSIBILITY_SEEK_STEP = 0.05;

const ACCESSIBILITY_ACTIONS = [
  { name: 'increment', label: '앞으로 이동' },
  { name: 'decrement', label: '뒤로 이동' },
];

const clampProgress = progress => {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(Math.max(progress, 0), 1);
};

const getGestureDirection = ({ dx, dy }) => {
  const horizontalDistance = Math.abs(dx);
  const verticalDistance = Math.abs(dy);

  if (
    verticalDistance >= VERTICAL_GESTURE_THRESHOLD &&
    verticalDistance > horizontalDistance
  ) {
    return 'vertical';
  }

  if (
    horizontalDistance >= HORIZONTAL_DRAG_THRESHOLD &&
    horizontalDistance >= verticalDistance
  ) {
    return 'horizontal';
  }

  return 'tap';
};

const useMusicWaveSeek = ({
  playbackProgress = 0,
  enabled = false,
  onSeek,
}) => {
  const waveWidthRef = useRef(0);
  const playbackProgressRef = useRef(0);
  const pendingProgressRef = useRef(0);
  const startProgressRef = useRef(0);
  const gestureDirectionRef = useRef('tap');

  const [waveWidth, setWaveWidth] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekProgress, setSeekProgress] = useState(0);

  const normalizedProgress = clampProgress(playbackProgress);
  const canSeek = enabled && typeof onSeek === 'function';

  playbackProgressRef.current = normalizedProgress;

  useEffect(() => {
    if (!canSeek) {
      setIsSeeking(false);
      gestureDirectionRef.current = 'tap';
    }
  }, [canSeek]);

  const handleLayout = useCallback(event => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);

    waveWidthRef.current = nextWidth;
    setWaveWidth(currentWidth =>
      currentWidth === nextWidth ? currentWidth : nextWidth,
    );
  }, []);

  const getEventProgress = useCallback(event => {
    const width = waveWidthRef.current;
    const locationX = event.nativeEvent.locationX;

    if (width <= 0 || !Number.isFinite(locationX)) return null;
    return clampProgress(locationX / width);
  }, []);

  const previewSeek = useCallback(progress => {
    const nextProgress = clampProgress(progress);

    pendingProgressRef.current = nextProgress;
    setSeekProgress(nextProgress);
    setIsSeeking(true);
  }, []);

  const cancelSeek = useCallback(() => {
    setIsSeeking(false);
    gestureDirectionRef.current = 'tap';
  }, []);

  const commitSeek = useCallback(progress => {
    if (!canSeek) return;

    const nextProgress = clampProgress(progress);

    pendingProgressRef.current = nextProgress;
    playbackProgressRef.current = nextProgress;
    setSeekProgress(nextProgress);
    setIsSeeking(false);
    gestureDirectionRef.current = 'tap';
    onSeek(nextProgress);
  }, [canSeek, onSeek]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => canSeek,

    onPanResponderGrant: event => {
      event.stopPropagation?.();
      gestureDirectionRef.current = 'tap';

      const eventProgress = getEventProgress(event);
      const startProgress = eventProgress ?? playbackProgressRef.current;

      startProgressRef.current = startProgress;
      pendingProgressRef.current = startProgress;
    },

    onPanResponderMove: (event, gestureState) => {
      const direction = getGestureDirection(gestureState);

      if (direction === 'vertical') {
        gestureDirectionRef.current = direction;
        setIsSeeking(false);
        return;
      }

      if (direction === 'horizontal') {
        gestureDirectionRef.current = direction;

        const eventProgress = getEventProgress(event);
        if (eventProgress !== null) previewSeek(eventProgress);
      }
    },

    onPanResponderRelease: event => {
      event.stopPropagation?.();

      if (gestureDirectionRef.current === 'vertical') {
        cancelSeek();
        return;
      }

      if (gestureDirectionRef.current === 'horizontal') {
        commitSeek(pendingProgressRef.current);
        return;
      }

      commitSeek(getEventProgress(event) ?? startProgressRef.current);
    },

    onPanResponderTerminate: cancelSeek,

    onPanResponderTerminationRequest: (_, gestureState) => {
      const isVertical =
        getGestureDirection(gestureState) === 'vertical';

      if (isVertical) {
        gestureDirectionRef.current = 'vertical';
        setIsSeeking(false);
      }

      return isVertical;
    },

    onShouldBlockNativeResponder: () => false,
  }), [
    canSeek,
    cancelSeek,
    commitSeek,
    getEventProgress,
    previewSeek,
  ]);

  const handleAccessibilityAction = useCallback(event => {
    if (!canSeek) return;

    const currentProgress = playbackProgressRef.current;
    const actionName = event.nativeEvent.actionName;

    if (actionName === 'increment') {
      commitSeek(currentProgress + ACCESSIBILITY_SEEK_STEP);
    } else if (actionName === 'decrement') {
      commitSeek(currentProgress - ACCESSIBILITY_SEEK_STEP);
    }
  }, [canSeek, commitSeek]);

  return {
    waveWidth,
    displayedProgress: isSeeking ? seekProgress : normalizedProgress,
    handleLayout,
    panHandlers: panResponder.panHandlers,
    accessibilityActions: ACCESSIBILITY_ACTIONS,
    handleAccessibilityAction,
  };
};

export default useMusicWaveSeek;