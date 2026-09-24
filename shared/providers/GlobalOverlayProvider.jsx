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
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Toast from '../components/feedback/Toast';
import Dim from '../components/layout/Dim';
import WindowOverlay from '../components/layout/WindowOverlay';

const DEFAULT_TOAST_DURATION = 3000;
const DIM_FADE_DURATION = 200;

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

const GlobalOverlayProvider = ({
  children,
}) => {
  const [overlay, setOverlay] =
    useState(null);

  const [toast, setToast] =
    useState({
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

  const overlayRef = useRef(null);
  const toastTimerRef = useRef(null);
  const isDimShownRef = useRef(false);

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

      currentOverlay.onClose?.();
    }, []);

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

  const hideToast =
    useCallback(() => {
      clearToastTimer();

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

      setToast({
        visible: true,
        message,
        icon,
        iconColor,
        buttonText,
        onPressButton,
        bottomOffset,
      });

      toastTimerRef.current =
        setTimeout(() => {
          setToast(previous => ({
            ...previous,
            visible: false,
          }));

          toastTimerRef.current =
            null;
        }, duration);
    }, [clearToastTimer]);

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
          closeOverlay(
            overlay.id,
          );

          return true;
        },
      );

    return () => {
      subscription.remove();
    };
  }, [
    closeOverlay,
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

      closeOverlay(overlay.id);
    }, [
      closeOverlay,
      overlay,
    ]);

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
                    {overlay.renderContent({
                      close: () =>
                        closeOverlay(
                          overlay.id,
                        ),
                      hideDim: () =>
                        hideDim(
                          overlay.id,
                        ),
                    })}
                  </View>
                </View>
              </View>
            )}

            {toast.visible && (
              <Animated.View
                entering={SlideInDown.duration(250)}
                exiting={SlideOutDown.duration(250)}
                pointerEvents="box-none"
                style={[
                  styles.toastLayer,
                  {
                    bottom:
                      toast.bottomOffset,
                  },
                ]}
              >
                <Toast
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