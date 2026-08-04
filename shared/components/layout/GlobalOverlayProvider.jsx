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

import Dim from './Dim';

const GlobalOverlayContext =
  createContext(null);

const GlobalOverlayProvider = ({
  children,
}) => {
  const [
    overlay,
    setOverlay,
  ] = useState(null);

  /**
   * closeOverlay에서 가장 최근 overlay 설정을
   * 참조할 수 있도록 ref에도 저장합니다.
   */
  const overlayRef =
    useRef(null);

  /**
   * 전역 Overlay를 엽니다.
   *
   * id:
   * Overlay 종류를 구분하는 고유값
   *
   * renderContent:
   * Dim 위에 표시할 요소
   *
   * contentContainerStyle:
   * 표시 요소의 위치와 정렬
   *
   * closeOnDimPress:
   * Dim을 눌렀을 때 닫을지 여부
   *
   * onClose:
   * Overlay가 닫힌 뒤 실행할 동작
   */
  const openOverlay =
    useCallback(
      ({
        id,
        renderContent,
        contentContainerStyle,
        dimStyle,
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
          closeOnDimPress,
          closeOnBackPress,
          accessibilityLabel,
          onClose,
        };

        overlayRef.current =
          nextOverlay;

        setOverlay(
          nextOverlay,
        );
      },
      [],
    );

  /**
   * 현재 Overlay를 닫습니다.
   *
   * id를 전달하면 해당 Overlay가 현재 열려 있을 때만
   * 닫히게 할 수 있습니다.
   */
  const closeOverlay =
    useCallback(
      id => {
        const currentOverlay =
          overlayRef.current;

        if (!currentOverlay) {
          return;
        }

        if (
          id &&
          currentOverlay.id !== id
        ) {
          return;
        }

        overlayRef.current =
          null;

        setOverlay(null);

        currentOverlay
          .onClose
          ?.();
      },
      [],
    );

  /**
   * Android 하드웨어 뒤로 가기 처리입니다.
   *
   * native Modal의 onRequestClose 대신
   * 전역 Overlay가 먼저 닫히게 합니다.
   */
  useEffect(
    () => {
      if (
        !overlay ||
        !overlay.closeOnBackPress
      ) {
        return undefined;
      }

      const subscription =
        BackHandler
          .addEventListener(
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
    },
    [
      closeOverlay,
      overlay,
    ],
  );

  const handlePressDim =
    useCallback(
      () => {
        if (
          !overlay
            ?.closeOnDimPress
        ) {
          return;
        }

        closeOverlay(
          overlay.id,
        );
      },
      [
        closeOverlay,
        overlay,
      ],
    );

  const isOverlayOpen =
    useCallback(
      id => {
        return (
          overlayRef
            .current
            ?.id === id
        );
      },
      [],
    );

  const contextValue =
    useMemo(
      () => ({
        activeOverlayId:
          overlay?.id ?? null,

        openOverlay,
        closeOverlay,
        isOverlayOpen,
      }),
      [
        closeOverlay,
        isOverlayOpen,
        openOverlay,
        overlay?.id,
      ],
    );

  return (
    <GlobalOverlayContext.Provider
      value={contextValue}
    >
      <View
        style={
          styles.root
        }
      >
        {children}

        {overlay && (
          <View
            accessibilityViewIsModal
            style={
              styles.overlay
            }
          >
            {/*
             * 프로젝트에서 사용하는 모든 Dim은
             * 이 한 곳에서 렌더링합니다.
             */}
            <Dim
              visible
              onPress={
                overlay
                  .closeOnDimPress
                  ? handlePressDim
                  : undefined
              }
              accessibilityLabel={
                overlay
                  .accessibilityLabel
              }
              style={
                overlay
                  .dimStyle
              }
            />

            {/*
             * FAB, Dialog, BottomSheet 등 실제 콘텐츠가
             * Dim 위에 표시되는 영역입니다.
             */}
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
                  overlay
                    .contentContainerStyle,
                ]}
              >
                {overlay.renderContent({
                  close: () =>
                    closeOverlay(
                      overlay.id,
                    ),
                })}
              </View>
            </View>
          </View>
        )}
      </View>
    </GlobalOverlayContext.Provider>
  );
};

const useGlobalOverlay =
  () => {
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

const styles =
  StyleSheet.create({
    root: {
      flex: 1,
      position: 'relative',
    },

    /**
     * NavigationContainer와 BottomNavigation을 포함한
     * React Native 앱 전체 영역을 덮습니다.
     */
    overlay: {
      ...StyleSheet.absoluteFillObject,

      zIndex: 999,
      elevation: 999,
    },

    contentLayer: {
      ...StyleSheet.absoluteFillObject,

      zIndex: 1,
      elevation: 1,
    },

    contentContainer: {
      position: 'absolute',
    },
  });

export {
  useGlobalOverlay,
};

export default memo(
  GlobalOverlayProvider,
);