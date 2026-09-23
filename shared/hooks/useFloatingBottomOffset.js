import { useEffect, useMemo, useState } from 'react';
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

/**
 * 화면 하단에 붙는 바(작성 BottomBar · 댓글 입력바)의 위치 값.
 *
 * bottom
 *   바를 화면 아래에서 얼마나 띄울지. 키보드가 올라와 있으면 키보드 높이,
 *   내려가 있으면 0 입니다. iOS 홈 인디케이터만큼 바를 '띄우면'
 *   바 아래로 배경이 비쳐 화면 하단과 간격이 벌어져 보이므로,
 *   SafeArea 는 띄우는 대신 paddingBottom 으로 처리합니다.
 *
 * paddingBottom
 *   바 내부 콘텐츠가 홈 인디케이터를 피하도록 주는 아래 여백.
 *   키보드가 올라와 있으면 키보드가 이미 그 영역을 덮으므로 0 입니다.
 *
 * total
 *   바가 없을 때 화면 하단에서 확보해야 하는 총 여백(Toast 등에서 사용).
 */
export function useFloatingBarPlacement() {
  const insets = useSafeAreaInsets();

  const keyboardHeight = useKeyboardHeight();

  const isKeyboardVisible = keyboardHeight > 0;

  const bottom = isKeyboardVisible ? keyboardHeight : 0;
  const paddingBottom = isKeyboardVisible ? 0 : insets.bottom;

  return useMemo(
    () => ({
      bottom,
      paddingBottom,
      total: bottom + paddingBottom,
    }),
    [bottom, paddingBottom],
  );
}

/**
 * 화면 하단에서 띄워야 하는 총 높이(px).
 * Toast 처럼 홈 인디케이터 '위에' 떠야 하는 요소에 사용합니다.
 */
export function useFloatingBottomOffset() {
  return useFloatingBarPlacement().total;
}
