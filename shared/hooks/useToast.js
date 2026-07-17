// hooks/useToast.js

import { useCallback, useEffect, useRef, useState } from 'react';
import { colors } from '../../../../shared/styles/color';

export function useToast() {
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'warning',
    color: colors.fgPositive,
    actionLabel: null,
    onPressAction: null,
  });

  const timerRef = useRef(null);

  const clearToastTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const showToast = useCallback(
    ({
      message,
      type = 'warning',
      duration = 3000,
      color = colors.fgPositive,
      actionLabel = null,
      onPressAction = null,
    }) => {
      clearToastTimer();

      setToast({
        visible: true,
        message,
        type,
        color,
        actionLabel,
        onPressAction,
      });

      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [clearToastTimer, hideToast],
  );

  const pressToastAction = useCallback(() => {
    clearToastTimer();

    toast.onPressAction?.();

    hideToast();
  }, [clearToastTimer, hideToast, toast.onPressAction]);

  useEffect(() => {
    return () => {
      clearToastTimer();
    };
  }, [clearToastTimer]);

  return {
    toast,
    showToast,
    hideToast,
    pressToastAction,
  };
}