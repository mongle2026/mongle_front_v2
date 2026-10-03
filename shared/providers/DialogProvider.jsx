import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import {
  Keyboard,
  StyleSheet,
  View,
} from 'react-native';
import Dim from '../components/layout/Dim';
import WindowOverlay from '../components/layout/WindowOverlay';
import { padding } from '../styles/token';
import { useHardwareBackClose, useOverlaySlot } from './useOverlaySlot';

const DialogContext = createContext(null);

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

        {dialog && (
          <WindowOverlay
            pointerEvents="auto"
          >
            <View
              accessibilityViewIsModal
              style={styles.overlay}
            >
              <Dim
                visible
                onPress={
                  dialog.closeOnDimPress
                    ? handlePressDim
                    : undefined
                }
                accessibilityLabel={
                  dialog.accessibilityLabel
                }
                style={dialog.dimStyle}
              />

              <View
                pointerEvents="box-none"
                style={[
                  styles.contentLayer,
                  dialog.contentContainerStyle,
                ]}
              >
                {dialog.renderContent({
                  close: () =>
                    closeDialog(
                      dialog.id,
                    ),
                })}
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