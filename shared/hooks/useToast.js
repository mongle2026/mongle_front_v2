import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

const DEFAULT_DURATION = 3000;

export function useToast() {
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    buttonText: null,
    onPressButton: null,
  });

  const timerRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (!timerRef.current) return;

    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const hideToast = useCallback(() => {
    clearTimer();

    setToast(previous => ({
      ...previous,
      visible: false,
    }));
  }, [clearTimer]);

  const showToast = useCallback(({
    message,
    duration = DEFAULT_DURATION,
    buttonText = null,
    onPressButton = null,
  }) => {
    clearTimer();

    setToast({
      visible: true,
      message,
      buttonText,
      onPressButton,
    });

    timerRef.current = setTimeout(() => {
      setToast(previous => ({
        ...previous,
        visible: false,
      }));

      timerRef.current = null;
    }, duration);
  }, [clearTimer]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return {
    toast,
    showToast,
    hideToast,
  };
}