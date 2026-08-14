import { useEffect, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useFloatingBottomOffset() {
  const insets = useSafeAreaInsets();

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

  return keyboardBottom > 0
    ? keyboardBottom
    : insets.bottom;
}