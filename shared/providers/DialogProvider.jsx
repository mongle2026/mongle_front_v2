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
  Keyboard,
  StyleSheet,
  View,
} from 'react-native';
import Dim from '../components/layout/Dim';
import WindowOverlay from '../components/layout/WindowOverlay';
import { padding } from '../styles/token';

const DialogContext = createContext(null);

const DialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);
  const dialogRef = useRef(null);

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
    if (!id) {
      console.warn('Dialog의 id가 필요합니다.');
      return;
    }

    if (typeof renderContent !== 'function') {
      console.warn('Dialog의 renderContent가 필요합니다.');
      return;
    }

    Keyboard.dismiss();

    const nextDialog = {
      id,
      renderContent,
      closeOnDimPress,
      closeOnBackPress,
      accessibilityLabel,
      contentContainerStyle,
      dimStyle,
      onClose,
    };

    dialogRef.current = nextDialog;
    setDialog(nextDialog);
  }, []);

  const closeDialog = useCallback(id => {
    const currentDialog = dialogRef.current;

    if (!currentDialog) return;
    if (id && currentDialog.id !== id) return;

    dialogRef.current = null;
    setDialog(null);

    currentDialog.onClose?.();
  }, []);

  const isDialogOpen = useCallback(id => {
    return dialogRef.current?.id === id;
  }, []);

  const handlePressDim = useCallback(() => {
    if (!dialog?.closeOnDimPress) return;

    closeDialog(dialog.id);
  }, [
    closeDialog,
    dialog,
  ]);

  useEffect(() => {
    if (
      !dialog ||
      !dialog.closeOnBackPress
    ) {
      return undefined;
    }

    const subscription =
      BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          closeDialog(dialog.id);
          return true;
        },
      );

    return () => {
      subscription.remove();
    };
  }, [
    closeDialog,
    dialog,
  ]);

  const contextValue = useMemo(() => ({
    activeDialogId:
      dialog?.id ?? null,
    openDialog,
    closeDialog,
    isDialogOpen,
  }), [
    closeDialog,
    dialog?.id,
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