import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Keyboard,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Dim from '../components/layout/Dim';
import WindowOverlay from '../components/layout/WindowOverlay';
import { padding } from '../styles/token';
import { useHardwareBackClose, useOverlaySlot } from './useOverlaySlot';

const DialogContext = createContext(null);

/*
 * 열기: 배경이 어두워지는 동안 다이얼로그가 살짝 작은 크기에서 커지며 떠오른다.
 * 닫기: 조금 더 빠르게 반대로 사라진다.
 *
 * iOS 는 다이얼로그를 별도 창(FullWindowOverlay)에 띄워서, 창을 바로 없애면
 * 사라지는 애니메이션을 볼 수 없다. 그래서 닫힌 뒤에도 애니메이션이 끝날 때까지 그려 둔다.
 */
const OPEN_TIMING = { duration: 240, easing: Easing.out(Easing.cubic) };
const CLOSE_TIMING = { duration: 160, easing: Easing.in(Easing.quad) };
const CONTENT_FROM_SCALE = 0.92;
const CONTENT_FROM_TRANSLATE_Y = 12;

const DialogProvider = ({ children }) => {
  const {
    slot: dialog,
    openSlot,
    closeSlot: closeDialog,
    isSlotOpen: isDialogOpen,
  } = useOverlaySlot('Dialog');

  const openDialog = useCallback(({
    id,
    renderContent,
    closeOnDimPress = true,
    closeOnBackPress = true,
    accessibilityLabel = '다이얼로그 닫기',
    contentContainerStyle,
    dimStyle,
    onClose,
  }) => {
    const isOpened = openSlot({
      id,
      renderContent,
      closeOnDimPress,
      closeOnBackPress,
      accessibilityLabel,
      contentContainerStyle,
      dimStyle,
      onClose,
    });

    if (isOpened) {
      Keyboard.dismiss();
    }
  }, [openSlot]);

  const handlePressDim = useCallback(() => {
    if (!dialog?.closeOnDimPress) return;

    closeDialog(dialog.id);
  }, [
    closeDialog,
    dialog,
  ]);

  useHardwareBackClose(dialog, closeDialog);

  // 화면에 그리는 다이얼로그. 닫혀도(dialog = null) 사라지는 애니메이션이 끝날 때까지 남겨 둔다
  const [renderedDialog, setRenderedDialog] = useState(dialog);
  if (dialog && dialog !== renderedDialog) {
    setRenderedDialog(dialog);
  }

  const visibility = useSharedValue(0);

  useEffect(() => {
    if (dialog) {
      visibility.value = withTiming(1, OPEN_TIMING);
      return;
    }

    visibility.value = withTiming(0, CLOSE_TIMING, finished => {
      if (finished) scheduleOnRN(setRenderedDialog, null);
    });
  }, [dialog, visibility]);

  const dimAnimatedStyle = useAnimatedStyle(() => ({
    opacity: visibility.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: visibility.value,
    transform: [
      { translateY: interpolate(visibility.value, [0, 1], [CONTENT_FROM_TRANSLATE_Y, 0]) },
      { scale: interpolate(visibility.value, [0, 1], [CONTENT_FROM_SCALE, 1]) },
    ],
  }));

  // 닫히는 중인 다이얼로그는 누를 수 없다
  const isClosing = !dialog && Boolean(renderedDialog);

  // 여는 / 닫는 함수만 넣어서 다이얼로그가 열리고 닫힐 때
  // useDialog를 쓰는 화면들이 다시 그려지지 않게 한다 (열림 여부는 isDialogOpen으로 확인)
  const contextValue = useMemo(() => ({
    openDialog,
    closeDialog,
    isDialogOpen,
  }), [
    closeDialog,
    isDialogOpen,
    openDialog,
  ]);

  return (
    <DialogContext.Provider
      value={contextValue}
    >
      <View style={styles.root}>
        {children}

        {renderedDialog && (
          <WindowOverlay
            pointerEvents={isClosing ? 'none' : 'auto'}
          >
            <View
              accessibilityViewIsModal
              style={styles.overlay}
            >
              <Animated.View
                pointerEvents="box-none"
                style={[StyleSheet.absoluteFill, dimAnimatedStyle]}
              >
                <Dim
                  visible
                  onPress={
                    renderedDialog.closeOnDimPress
                      ? handlePressDim
                      : undefined
                  }
                  accessibilityLabel={
                    renderedDialog.accessibilityLabel
                  }
                  style={renderedDialog.dimStyle}
                />
              </Animated.View>

              <View
                pointerEvents="box-none"
                style={[
                  styles.contentLayer,
                  renderedDialog.contentContainerStyle,
                ]}
              >
                <Animated.View
                  pointerEvents="box-none"
                  style={[styles.content, contentAnimatedStyle]}
                >
                  {renderedDialog.renderContent({
                    close: () =>
                      closeDialog(
                        renderedDialog.id,
                      ),
                  })}
                </Animated.View>
              </View>
            </View>
          </WindowOverlay>
        )}
      </View>
    </DialogContext.Provider>
  );
};

const useDialog = () => {
  const context =
    useContext(DialogContext);

  if (!context) {
    throw new Error(
      'useDialog는 DialogProvider 안에서 사용해야 합니다.',
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
    flex: 1,
  },
  // 다이얼로그 내용이 원래 크기대로 가운데 오도록 감싼다 (contentLayer 의 정렬을 그대로 따른다)
  content: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  contentLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    paddingHorizontal: padding.XL,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    elevation: 1,
  },
});

export { useDialog };
export default memo(DialogProvider);