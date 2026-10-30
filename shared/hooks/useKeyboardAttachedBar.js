import { useState } from 'react';
import {
  KeyboardState,
  useAnimatedKeyboard,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * 키보드 위에 붙는 하단 바(댓글 입력바 · 작성 BottomBar)의 위치 값.
 *
 * 바는 키보드 높이를 프레임마다 따라가며(useAnimatedKeyboard) 키보드와 한 몸처럼 아래에서 올라온다.
 * 안쪽 아래 여백은 항상 홈 인디케이터만큼 두고, 키보드가 올라오면 그 여백만큼은 키보드 뒤로 겹쳐서
 * 여백이 툭 사라지는 순간 없이 이어지게 한다.
 * 화면 쪽 값(keyboardHeight 등)도 같은 keyboard 값에서 받아, 바 위치와 어긋나지 않게 한다.
 *
 * 바 컨테이너는 position: absolute · bottom: 0 으로 두고
 * paddingBottom 에 barPadding, style 에 barAnimatedStyle 을 넣는다.
 *
 * keyboardHeight    : 키보드가 다 올라왔을 때의 높이 (내려가 있으면 0)
 * isKeyboardVisible : 키보드가 다 올라와 있는지
 * barBottom         : 키보드가 다 올라왔을 때 바를 화면 아래에서 띄우는 값 (스크롤 여백 · 위치 계산용)
 * barPadding        : 바 안쪽 아래 여백 (홈 인디케이터). 바 높이를 재면 이 여백이 포함된다
 * barAnimatedStyle  : 바를 키보드에 맞춰 올리는 animated style
 */
export default function useKeyboardAttachedBar() {
  const insets = useSafeAreaInsets();
  const keyboard = useAnimatedKeyboard();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  /*
   * 키보드가 올라온 채 화면을 나가면 (Android) reanimated 가 키보드 닫힘을 놓쳐서
   * 다음에 들어온 화면에 예전 '열림' 높이를 그대로 넘겨준다.
   * 그래서 이 화면에서 키보드가 실제로 움직이는 걸 한 번 본 뒤부터만 그 높이를 따라간다.
   */
  const isKeyboardTracked = useSharedValue(false);

  useAnimatedReaction(
    () => keyboard.state.value,
    state => {
      if (state === KeyboardState.OPENING || state === KeyboardState.CLOSING) {
        isKeyboardTracked.value = true;
      }

      if (!isKeyboardTracked.value) return;

      // 키보드가 다 올라오거나 다 내려갔을 때만 화면 쪽 값으로 넘긴다
      if (state === KeyboardState.OPEN) {
        scheduleOnRN(setKeyboardHeight, keyboard.height.value);
      } else if (state === KeyboardState.CLOSED) {
        scheduleOnRN(setKeyboardHeight, 0);
      }
    },
  );

  const barAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: isKeyboardTracked.value
          ? -Math.max(keyboard.height.value - insets.bottom, 0)
          : 0,
      },
    ],
  }));

  return {
    keyboardHeight,
    isKeyboardVisible: keyboardHeight > 0,
    barBottom: Math.max(keyboardHeight - insets.bottom, 0),
    barPadding: insets.bottom,
    barAnimatedStyle,
  };
}
