import { useCallback, useRef } from 'react';

const DOUBLE_TAP_DELAY = 300;
const DOUBLE_TAP_COOLDOWN = 350;

export default function useDoubleTapLike({
  isLiked = false,
  onToggleLike,
  onSingleTap,
  doubleTapDelay = DOUBLE_TAP_DELAY,
  cooldown = DOUBLE_TAP_COOLDOWN,
} = {}) {
  const likeRef = useRef(null);
  const lastTapRef = useRef(0);
  const lastToggleRef = useRef(0);
  const tapTimerRef = useRef(null);

  const handleTap = useCallback(() => {
    const now = Date.now();

    if (now - lastToggleRef.current < cooldown) {
      return;
    }

    if (now - lastTapRef.current < doubleTapDelay) {
      clearTimeout(tapTimerRef.current);

      lastTapRef.current = 0;
      lastToggleRef.current = now;

      // 이미 좋아요 상태여도 하트 애니메이션은 실행
      likeRef.current?.bounce();

      // 좋아요가 아닌 경우에만 좋아요 처리
      if (!isLiked) {
        onToggleLike?.();
      }

      return;
    }

    lastTapRef.current = now;

    if (onSingleTap) {
      tapTimerRef.current = setTimeout(() => {
        onSingleTap();
      }, doubleTapDelay);
    }
  }, [
    isLiked,
    onToggleLike,
    onSingleTap,
    doubleTapDelay,
    cooldown,
  ]);

  return {
    likeRef,
    handleTap,
  };
}