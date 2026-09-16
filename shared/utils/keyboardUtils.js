import { Keyboard } from 'react-native';

// keyboardDidHide가 오지 않는 경우(이미 내려가는 중 등)를 대비한 최대 대기 시간
const KEYBOARD_HIDE_TIMEOUT_MS = 500;

/**
 * 키보드를 내리고, 다 내려간 뒤에 callback 을 실행합니다.
 * 키보드가 없으면 바로 실행합니다.
 *
 * 키보드가 내려가는 동안에는 화면 하단 offset 이 바뀌어 리렌더되고
 * (iOS 는 LayoutAnimation 도 걸립니다), 그와 동시에 BottomSheet 를 열면
 * 올라가는 애니메이션 프레임이 끊기기 때문에 둘을 나눕니다.
 */
export const dismissKeyboardThen = callback => {
  if (!Keyboard.isVisible()) {
    callback();
    return;
  }

  let done = false;

  const run = () => {
    if (done) return;
    done = true;

    subscription.remove();
    clearTimeout(timeoutId);
    callback();
  };

  const subscription = Keyboard.addListener('keyboardDidHide', run);
  const timeoutId = setTimeout(run, KEYBOARD_HIDE_TIMEOUT_MS);

  Keyboard.dismiss();
};
