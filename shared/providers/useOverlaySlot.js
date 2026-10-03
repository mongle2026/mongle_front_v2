import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';

/*
 * DialogProvider · GlobalOverlayProvider 가 같이 쓰는 '한 번에 하나만 뜨는 창' 상태.
 * - 열 때 id / renderContent 를 확인한다
 * - 새 창으로 덮어쓰기 전에 기존 창의 onClose 를 불러서
 *   여는 쪽 상태(예: WriteFab isOpen)가 남지 않게 한다
 * - close(id) 는 지금 열린 창이 그 id 일 때만 닫는다 (id 없이 부르면 무조건 닫는다)
 * - isOpen(id) 는 ref 로 확인해서, 열림 상태를 context value 에 넣지 않아도 되게 한다
 */
export function useOverlaySlot(name) {
  const [slot, setSlot] = useState(null);
  const slotRef = useRef(null);

  // 열었으면 true
  const openSlot = useCallback(nextSlot => {
    if (!nextSlot?.id) {
      console.warn(`${name}의 id가 필요합니다.`);
      return false;
    }

    if (typeof nextSlot.renderContent !== 'function') {
      console.warn(`${name}의 renderContent가 필요합니다.`);
      return false;
    }

    const previousSlot = slotRef.current;

    slotRef.current = nextSlot;
    setSlot(nextSlot);

    previousSlot?.onClose?.();

    return true;
  }, [name]);

  // 닫았으면 true
  const closeSlot = useCallback(id => {
    const currentSlot = slotRef.current;

    if (!currentSlot) return false;
    if (id && currentSlot.id !== id) return false;

    slotRef.current = null;
    setSlot(null);

    currentSlot.onClose?.();

    return true;
  }, []);

  const isSlotOpen = useCallback(id => slotRef.current?.id === id, []);

  return { slot, slotRef, openSlot, closeSlot, isSlotOpen };
}

// 창이 closeOnBackPress 면 안드로이드 뒤로가기로 onBack(id) 를 부르고, 화면 뒤로가기는 막는다
export function useHardwareBackClose(slot, onBack) {
  useEffect(() => {
    if (!slot?.closeOnBackPress) return undefined;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack(slot.id);
      return true;
    });

    return () => {
      subscription.remove();
    };
  }, [onBack, slot]);
}
