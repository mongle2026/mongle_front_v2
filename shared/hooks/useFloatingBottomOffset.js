import { useEffect, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * 지금 키보드가 화면을 얼마나 덮고 있는지(px).
 * 키보드가 내려가 있으면 0.
 */
export function useKeyboardHeight() {
  const [keyboardBottom, setKeyboardBottom] =
    useState(0);

  useEffect(() => {
    const handleShow = event => {
      if (Platform.OS === 'ios') {
        Keyboard.scheduleLayoutAnimation?.(event);
      }

      const windowHeight =
        Dimensions.get('window').height;

      const keyboardTopY =
        event.endCoordinates?.screenY ??
        windowHeight;

      const keyboardHeightInWindow =
        Math.max(
          0,
          windowHeight - keyboardTopY,
        );

      setKeyboardBottom(keyboardHeightInWindow);
    };

    const handleHide = event => {
      if (Platform.OS === 'ios' && event) {
        Keyboard.scheduleLayoutAnimation?.(event);
      }

      setKeyboardBottom(0);
    };

    const showEvent =
      Platform.OS === 'ios'
        ? 'keyboardWillShow'
        : 'keyboardDidShow';

    const hideEvent =
      Platform.OS === 'ios'
        ? 'keyboardWillHide'
        : 'keyboardDidHide';

    const showSub = Keyboard.addListener(
      showEvent,
      handleShow,
    );

    const hideSub = Keyboard.addListener(
      hideEvent,
      handleHide,
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return keyboardBottom;
}

export function useFloatingBottomOffset() {
  const insets = useSafeAreaInsets();

  const keyboardHeight = useKeyboardHeight();

  return keyboardHeight > 0
    ? keyboardHeight
    : insets.bottom;
}
