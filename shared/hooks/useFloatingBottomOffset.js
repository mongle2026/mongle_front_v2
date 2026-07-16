import { useEffect, useState } from 'react';
import { Keyboard, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useFloatingBottomOffset() {
  const insets = useSafeAreaInsets();
  const [keyboardBottom, setKeyboardBottom] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', event => {
      const windowHeight = Dimensions.get('window').height;
      const keyboardTopY = event.endCoordinates.screenY;

      const keyboardHeightInWindow = Math.max(0, windowHeight - keyboardTopY);

      setKeyboardBottom(keyboardHeightInWindow);
    });

    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardBottom(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return keyboardBottom > 0 ? keyboardBottom : insets.bottom;
}