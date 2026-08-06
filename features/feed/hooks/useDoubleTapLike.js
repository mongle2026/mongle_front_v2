import { useCallback, useRef } from 'react';

const DEFAULT_DOUBLE_TAP_DELAY = 300;
const DEFAULT_DOUBLE_TAP_COOLDOWN = 350;

export default function useDoubleTapLike({
  isLiked = false,
  disabled = false,
  onLike,
  doubleTapDelay = DEFAULT_DOUBLE_TAP_DELAY,
  cooldown = DEFAULT_DOUBLE_TAP_COOLDOWN,
} = {}) {
  const likeButtonRef = useRef(null);
  const lastTapAtRef = useRef(0);
  const lastDoubleTapAtRef = useRef(0);

  const handleTap = useCallback(() => {
    if (disabled) return;

    const now = Date.now();

    if (now - lastDoubleTapAtRef.current < cooldown) {
      return;
    }

    const elapsedSinceLastTap = now - lastTapAtRef.current;

    lastTapAtRef.current = now;

    if (
      elapsedSinceLastTap <= 0 ||
      elapsedSinceLastTap > doubleTapDelay
    ) {
      return;
    }

    lastTapAtRef.current = 0;
    lastDoubleTapAtRef.current = now;

    likeButtonRef.current?.bounce();

    if (!isLiked) {
      onLike?.();
    }
  }, [
    cooldown,
    disabled,
    doubleTapDelay,
    isLiked,
    onLike,
  ]);

  return {
    likeButtonRef,
    handleTap,
  };
}