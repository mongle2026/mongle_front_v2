import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BackHandler,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import Toast from '../components/feedback/Toast';
import Dim from '../components/layout/Dim';
import WindowOverlay from '../components/layout/WindowOverlay';

const DEFAULT_TOAST_DURATION = 3000;
const DIM_FADE_DURATION = 200;
const TOAST_ANIMATION_DURATION = 250;
// 토스트가 등장/퇴장할 때 제자리에서 아래로 떨어진 거리
const TOAST_ANIMATION_OFFSET = 24;

// 토스트 등장/퇴장. 제자리보다 TOAST_ANIMATION_OFFSET 아래에서 이동하면서 페이드한다
const toastEntering = () => {
  'worklet';

  const timing = {
    duration: TOAST_ANIMATION_DURATION,
  };

  return {
    initialValues: {
      opacity: 0,
      transform: [
        { translateY: TOAST_ANIMATION_OFFSET },
      ],
    },
    animations: {
      opacity: withTiming(1, timing),
      transform: [
        { translateY: withTiming(0, timing) },
      ],
    },
  };
};

const toastExiting = () => {
  'worklet';

  const timing = {
    duration: TOAST_ANIMATION_DURATION,
  };

  return {
    initialValues: {
      opacity: 1,
      transform: [
        { translateY: 0 },
      ],
    },
    animations: {
      opacity: withTiming(0, timing),
      transform: [
        {
          translateY: withTiming(
            TOAST_ANIMATION_OFFSET,
            timing,
          ),
        },
      ],
    },
  };
};

// 토스트를 아래로 끌어서 닫기. 이 거리(토스트 높이 대비 비율)나 속도를 넘기면 닫는다
const TOAST_DISMISS_DISTANCE_RATIO = 0.5;
const TOAST_DISMISS_VELOCITY = 500;
// 위로 끌 때는 이 비율만큼만 따라가서 저항감을 준다
const TOAST_UPWARD_RESISTANCE = 0.15;
const TOAST_SWIPE_ACTIVE_OFFSET = 8;

const TOAST_RETURN_SPRING_CONFIG = {
  damping: 18,
  stiffness: 260,
  mass: 0.5,
  overshootClamping: true,
};

// 토스트를 잡고 있는 동안 자동 닫힘 타이머를 멈추고, 아래로 충분히 끌었다 놓으면 닫는다.
// 닫힐 때는 끌린 위치에서 토스트 퇴장 애니메이션(exiting)이 이어진다
const ToastSwipeArea = memo(({
  children,
  onTouchStart,
  onTouchEnd,
  onDismiss,
}) => {
  const dragY = useSharedValue(0);
  const height = useSharedValue(0);
  // 제스처 콜백(워클릿)끼리 공유해야 해서 지역 변수 대신 shared value로 둔다
  const isDismissed = useSharedValue(false);

  const handleLayout = useCallback(event => {
    height.value = event.nativeEvent.layout.height;
  }, [height]);

  const gesture = useMemo(() => (
    Gesture.Pan()
      .activeOffsetY([
        -TOAST_SWIPE_ACTIVE_OFFSET,
        TOAST_SWIPE_ACTIVE_OFFSET,
      ])
      .onBegin(() => {
        isDismissed.value = false;
        scheduleOnRN(onTouchStart);
      })
      .onUpdate(event => {
        dragY.value = event.translationY > 0
          ? event.translationY
          : event.translationY * TOAST_UPWARD_RESISTANCE;
      })
      .onEnd(event => {
        const shouldDismiss =
          dragY.value > height.value * TOAST_DISMISS_DISTANCE_RATIO ||
          event.velocityY > TOAST_DISMISS_VELOCITY;

        if (shouldDismiss) {
          isDismissed.value = true;
          scheduleOnRN(onDismiss);
          return;
        }

        dragY.value = withSpring(0, TOAST_RETURN_SPRING_CONFIG);
      })
      .onFinalize(() => {
        if (isDismissed.value) {
          return;
        }

        // 탭만 하고 뗐을 때 등 onEnd 없이 끝난 경우에도 제자리로
        dragY.value = withSpring(0, TOAST_RETURN_SPRING_CONFIG);
        scheduleOnRN(onTouchEnd);
      })
  ), [dragY, height, isDismissed, onDismiss, onTouchEnd, onTouchStart]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: dragY.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        onLayout={handleLayout}
        style={animatedStyle}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
});

ToastSwipeArea.displayName = 'ToastSwipeArea';

// 오버레이 Dim. visible이 바뀌면 페이드 인/아웃하고,
// 페이드 아웃이 끝나면 onHidden으로 알려서 그때 언마운트한다
const OverlayDim = memo(({
  visible,
  onPress,
  accessibilityLabel,
  style,
  onHidden,
}) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(
      visible ? 1 : 0,
      { duration: DIM_FADE_DURATION },
      finished => {
        if (finished && !visible) {
          scheduleOnRN(onHidden);
        }
      },
    );
  }, [onHidden, opacity, visible]);

  const animatedStyle =
    useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

  return (
    <Animated.View
      pointerEvents={
        visible ? 'box-none' : 'none'
      }
      style={[
        StyleSheet.absoluteFill,
        animatedStyle,
      ]}
    >
      <Dim
        visible
        onPress={onPress}
        accessibilityLabel={
          accessibilityLabel
        }
        style={style}
      />
    </Animated.View>
  );
});

OverlayDim.displayName = 'OverlayDim';

const GlobalOverlayContext =
  createContext(null);

// 오버레이 콘텐츠가 닫힐 때(Dim/뒤로가기/renderContent의 close) 자체 닫힘
// 애니메이션을 먼저 보여주고 싶으면 여기에 닫기 요청 핸들러를 등록한다 (예: BottomSheet).
// 핸들러가 true를 반환하면 콘텐츠가 애니메이션 후 close를 다시 부르고,
// false를 반환하거나 등록된 핸들러가 없으면 바로 닫는다.
export const OverlayCloseRequestContext =
  createContext(null);

const GlobalOverlayProvider = ({
  children,
}) => {
  const [overlay, setOverlay] =
    useState(null);

  const [toast, setToast] =
    useState({
      id: 0,
      visible: false,
      message: '',
      icon: undefined,
      iconColor: undefined,
      buttonText: null,
      onPressButton: null,
      bottomOffset: 0,
    });

  // 닫힌 뒤에도 페이드 아웃이 끝날 때까지 Dim을 남겨두기 위한 상태
  const [isDimMounted, setIsDimMounted] =
    useState(false);
  const [isDimHidden, setIsDimHidden] =
    useState(false);
  const [dimStyle, setDimStyle] =
    useState(undefined);
  // 콘텐츠가 닫힘 애니메이션 중인지. 이 동안은 Dim이 사라져도 뒤 화면 터치를 막는다
  const [isOverlayClosing, setIsOverlayClosing] =
    useState(false);

  const overlayRef = useRef(null);
  const toastTimerRef = useRef(null);
  // 토스트를 잡고 있는 동안 타이머를 멈췄다가 남은 시간만큼 다시 돌리기 위한 값
  const toastTimerStartRef = useRef(0);
  const toastRemainingRef = useRef(0);
  // 토스트가 떠 있는 동안 새 토스트가 오면(같은 문구여도) 내용 전환을 알리기 위한 id
  const toastIdRef = useRef(0);
  const isDimShownRef = useRef(false);
  const closeRequestRef = useRef(null);

  const openOverlay = useCallback(({
    id,
    renderContent,
    contentContainerStyle,
    dimStyle,
    showDim = true,
    closeOnDimPress = true,
    closeOnBackPress = true,
    accessibilityLabel = '배경 닫기',
    onClose,
  }) => {
    if (!id) {
      console.warn(
        'GlobalOverlay의 id가 필요합니다.',
      );
      return;
    }

    if (
      typeof renderContent !==
      'function'
    ) {
      console.warn(
        'GlobalOverlay의 renderContent가 필요합니다.',
      );
      return;
    }

    const nextOverlay = {
      id,
      renderContent,
      contentContainerStyle,
      dimStyle,
      showDim,
      closeOnDimPress,
      closeOnBackPress,
      accessibilityLabel,
      onClose,
    };

    // 기존 오버레이를 덮어쓰기 전에 닫힘을 알려서
    // 여는 쪽 상태(예: WriteFab isOpen)가 남지 않게 함
    const previousOverlay =
      overlayRef.current;

    overlayRef.current =
      nextOverlay;

    previousOverlay?.onClose?.();

    setOverlay(nextOverlay);
    setIsDimHidden(false);
    setIsOverlayClosing(false);

    if (showDim) {
      setDimStyle(dimStyle);
      setIsDimMounted(true);
    }
  }, []);

  const closeOverlay =
    useCallback(id => {
      const currentOverlay =
        overlayRef.current;

      if (!currentOverlay) return;

      if (
        id &&
        currentOverlay.id !== id
      ) {
        return;
      }

      overlayRef.current = null;
      setOverlay(null);
      setIsOverlayClosing(false);

      currentOverlay.onClose?.();
    }, []);

  // 콘텐츠가 자체 닫힘 애니메이션을 하는 동안 Dim을 먼저 페이드 아웃할 때 사용
  // (예: FAB의 expandedRow가 내려가는 동안 Dim도 같이 사라지게)
  const hideDim =
    useCallback(id => {
      if (
        overlayRef.current?.id !== id
      ) {
        return;
      }

      setIsDimHidden(true);
    }, []);

  const registerCloseRequest =
    useCallback((id, handler) => {
      closeRequestRef.current = {
        id,
        handler,
      };

      return () => {
        if (
          closeRequestRef.current
            ?.handler === handler
        ) {
          closeRequestRef.current =
            null;
        }
      };
    }, []);

  // Dim/뒤로가기/close로 닫을 때: 콘텐츠가 닫힘 애니메이션을 맡으면
  // Dim만 같이 페이드 아웃하고, 아니면 바로 닫는다
  const requestCloseOverlay =
    useCallback(id => {
      const request =
        closeRequestRef.current;

      if (
        request?.id === id &&
        request.handler()
      ) {
        hideDim(id);
        setIsOverlayClosing(true);
        return;
      }

      closeOverlay(id);
    }, [closeOverlay, hideDim]);

  const clearToastTimer =
    useCallback(() => {
      if (!toastTimerRef.current) {
        return;
      }

      clearTimeout(
        toastTimerRef.current,
      );

      toastTimerRef.current = null;
    }, []);

  const startToastTimer =
    useCallback(duration => {
      clearToastTimer();

      toastTimerStartRef.current =
        Date.now();
      toastRemainingRef.current =
        duration;

      toastTimerRef.current =
        setTimeout(() => {
          setToast(previous => ({
            ...previous,
            visible: false,
          }));

          toastTimerRef.current =
            null;
          toastRemainingRef.current = 0;
        }, duration);
    }, [clearToastTimer]);

  const pauseToastTimer =
    useCallback(() => {
      if (!toastTimerRef.current) {
        return;
      }

      toastRemainingRef.current =
        Math.max(
          0,
          toastRemainingRef.current -
            (Date.now() -
              toastTimerStartRef.current),
        );

      clearToastTimer();
    }, [clearToastTimer]);

  const resumeToastTimer =
    useCallback(() => {
      // 이미 돌고 있거나(새 토스트) 닫힌 뒤면 다시 켜지 않는다
      if (
        toastTimerRef.current ||
        toastRemainingRef.current <= 0
      ) {
        return;
      }

      startToastTimer(
        toastRemainingRef.current,
      );
    }, [startToastTimer]);

  const hideToast =
    useCallback(() => {
      clearToastTimer();
      toastRemainingRef.current = 0;

      setToast(previous => ({
        ...previous,
        visible: false,
      }));
    }, [clearToastTimer]);

  const showToast =
    useCallback(({
      message,
      duration =
        DEFAULT_TOAST_DURATION,
      icon = undefined,
      iconColor = undefined,
      buttonText = null,
      onPressButton = null,
      bottomOffset = 0,
    }) => {
      if (!message) {
        console.warn(
          'Toast의 message가 필요합니다.',
        );
        return;
      }

      clearToastTimer();

      toastIdRef.current += 1;

      setToast({
        id: toastIdRef.current,
        visible: true,
        message,
        icon,
        iconColor,
        buttonText,
        onPressButton,
        bottomOffset,
      });

      startToastTimer(duration);
    }, [clearToastTimer, startToastTimer]);

  const handlePressToastButton =
    useCallback(() => {
      const onPressButton =
        toast.onPressButton;

      hideToast();

      onPressButton?.();
    }, [
      hideToast,
      toast.onPressButton,
    ]);

  useEffect(() => {
    if (
      !overlay ||
      !overlay.closeOnBackPress
    ) {
      return undefined;
    }

    const subscription =
      BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          requestCloseOverlay(
            overlay.id,
          );

          return true;
        },
      );

    return () => {
      subscription.remove();
    };
  }, [
    requestCloseOverlay,
    overlay,
  ]);

  useEffect(() => {
    return () => {
      clearToastTimer();
    };
  }, [clearToastTimer]);

  const handlePressDim =
    useCallback(() => {
      if (
        !overlay?.closeOnDimPress
      ) {
        return;
      }

      requestCloseOverlay(overlay.id);
    }, [
      requestCloseOverlay,
      overlay,
    ]);

  const isDimShown =
    Boolean(overlay?.showDim) &&
    !isDimHidden;

  isDimShownRef.current = isDimShown;

  const handleDimHidden =
    useCallback(() => {
      // 페이드 아웃 도중 다시 열렸으면 언마운트하지 않는다
      if (isDimShownRef.current) return;

      setIsDimMounted(false);
    }, []);

  const isOverlayOpen =
    useCallback(id => {
      return (
        overlayRef.current?.id === id
      );
    }, []);

  // 오버레이 열림 상태(overlay)는 value에 넣지 않습니다.
  // 넣으면 열고 닫을 때마다 useGlobalOverlay를 쓰는 모든 화면이
  // 리렌더되어 시트가 올라가는 프레임이 끊깁니다.
  // 현재 열린 오버레이는 isOverlayOpen(id)으로 확인합니다.
  const contextValue =
    useMemo(() => ({
      openOverlay,
      closeOverlay,
      isOverlayOpen,
      showToast,
      hideToast,
    }), [
      closeOverlay,
      hideToast,
      isOverlayOpen,
      openOverlay,
      showToast,
    ]);

  const overlayId = overlay?.id;

  const closeRequestValue =
    useMemo(() => ({
      register: handler =>
        registerCloseRequest(
          overlayId,
          handler,
        ),
    }), [overlayId, registerCloseRequest]);

  const hasWindowContent =
    Boolean(overlay) ||
    isDimMounted ||
    toast.visible;

  return (
    <GlobalOverlayContext.Provider
      value={contextValue}
    >
      <View style={styles.root}>
        {children}

        {hasWindowContent && (
          <WindowOverlay>
            {isDimMounted && (
              <OverlayDim
                visible={isDimShown}
                onPress={
                  overlay?.closeOnDimPress
                    ? handlePressDim
                    : undefined
                }
                accessibilityLabel={
                  overlay?.accessibilityLabel
                }
                style={dimStyle}
                onHidden={handleDimHidden}
              />
            )}

            {overlay && (
              <View
                pointerEvents="box-none"
                accessibilityViewIsModal={
                  overlay.showDim
                }
                style={
                  styles.overlay
                }
              >
                {isOverlayClosing && (
                  <View
                    style={
                      StyleSheet.absoluteFill
                    }
                  />
                )}

                <View
                  pointerEvents="box-none"
                  style={
                    styles.contentLayer
                  }
                >
                  <View
                    pointerEvents="box-none"
                    style={[
                      styles.contentContainer,
                      overlay.contentContainerStyle,
                    ]}
                  >
                    <OverlayCloseRequestContext.Provider
                      value={closeRequestValue}
                    >
                      {overlay.renderContent({
                        close: () =>
                          requestCloseOverlay(
                            overlay.id,
                          ),
                        hideDim: () =>
                          hideDim(
                            overlay.id,
                          ),
                      })}
                    </OverlayCloseRequestContext.Provider>
                  </View>
                </View>
              </View>
            )}

            {toast.visible && (
              <Animated.View
                entering={toastEntering}
                exiting={toastExiting}
                pointerEvents="box-none"
                style={[
                  styles.toastLayer,
                  {
                    bottom:
                      toast.bottomOffset,
                  },
                ]}
              >
                <ToastSwipeArea
                  onTouchStart={pauseToastTimer}
                  onTouchEnd={resumeToastTimer}
                  onDismiss={hideToast}
                >
                  <Toast
                    contentKey={toast.id}
                    text={toast.message}
                    icon={toast.icon}
                    iconColor={toast.iconColor}
                    buttonText={
                      toast.buttonText
                    }
                    onPressButton={
                      toast.buttonText
                        ? handlePressToastButton
                        : undefined
                    }
                  />
                </ToastSwipeArea>
              </Animated.View>
            )}
          </WindowOverlay>
        )}
      </View>
    </GlobalOverlayContext.Provider>
  );
};

const useGlobalOverlay = () => {
  const context =
    useContext(
      GlobalOverlayContext,
    );

  if (!context) {
    throw new Error(
      'useGlobalOverlay는 GlobalOverlayProvider 안에서 사용해야 합니다.',
    );
  }

  return context;
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  contentLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
    elevation: 1,
  },
  contentContainer: {
    position: 'absolute',
  },
  toastLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 2,
    elevation: 2,
  },
});

export {
  useGlobalOverlay,
};

export default memo(
  GlobalOverlayProvider,
);