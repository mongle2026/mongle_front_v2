import { useCallback, useEffect, useRef } from 'react';

const DOUBLE_TAP_DELAY = 300;
const DOUBLE_TAP_COOLDOWN = 350;

export default function useDoubleTapLike({
  isLiked = false,
  disabled = false,
  onLike,
  onSingleTap,
  doubleTapDelay = DOUBLE_TAP_DELAY,
  cooldown = DOUBLE_TAP_COOLDOWN,
} = {}) {
  const likeButtonRef = useRef(null);
  const lastTapRef = useRef(0);
  const lastLikeRef = useRef(0);
  const singleTapTimerRef = useRef(null);

  const handleTap = useCallback(() => {
    const now = Date.now();

    if (now - lastLikeRef.current < cooldown) {
      return;
    }

    if (now - lastTapRef.current < doubleTapDelay) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }

      lastTapRef.current = 0;
      lastLikeRef.current = now;

      likeButtonRef.current?.bounce();

      if (!isLiked && !disabled) {
        onLike?.();
      }

      return;
    }

    lastTapRef.current = now;

    if (onSingleTap) {
      singleTapTimerRef.current = setTimeout(() => {
        lastTapRef.current = 0;
        singleTapTimerRef.current = null;
        onSingleTap();
      }, doubleTapDelay);
    }
  }, [
    cooldown,
    disabled,
    doubleTapDelay,
    isLiked,
    onLike,
    onSingleTap,
  ]);

  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
      }
    };
  }, []);

  return {
    likeButtonRef,
    handleTap,
  };
}