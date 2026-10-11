import { useCallback, useRef } from 'react';

/**
 * 포커스된 입력창이 ScrollView 보이는 영역의 세로 가운데에 오도록 스크롤하는 훅.
 * 키보드가 올라와 ScrollView가 줄어든 상태를 기준으로 계산합니다.
 * 내용이 짧아 더 스크롤할 수 없으면 갈 수 있는 끝까지만 스크롤합니다.
 *
 * @param {boolean} isKeyboardVisible 키보드가 올라와 있는지
 * @returns {{ scrollViewRef, handleScrollViewLayout, focusField, blurField }}
 *   scrollViewRef / handleScrollViewLayout 은 ScrollView 의 ref / onLayout 에,
 *   focusField(fieldRef) / blurField(fieldRef) 는 입력창의 onFocus / onBlur 에서 부릅니다.
 *   fieldRef 는 가운데에 맞출 입력창 전체(View)의 ref 입니다.
 */
export default function useScrollFocusedFieldToCenter({
  isKeyboardVisible,
}) {
  const scrollViewRef = useRef(null);
  const focusedFieldRef = useRef(null);
  const viewportHeightRef = useRef(0);

  const scrollToFocusedField = useCallback(() => {
    const scrollView = scrollViewRef.current;
    const field = focusedFieldRef.current?.current;
    const contentView = scrollView?.getInnerViewRef();
    const viewportHeight = viewportHeightRef.current;

    if (!field || !contentView || viewportHeight === 0) return;

    field.measureLayout(contentView, (_fieldX, fieldY, _fieldWidth, fieldHeight) => {
      contentView.measure((_x, _y, _width, contentHeight) => {
        const maxScrollY = Math.max(0, contentHeight - viewportHeight);
        const targetY = fieldY + fieldHeight / 2 - viewportHeight / 2;

        scrollView.scrollTo({
          y: Math.min(Math.max(targetY, 0), maxScrollY),
          animated: true,
        });
      });
    });
  }, []);

  // 처음 포커스할 때는 키보드가 아직 안 올라와 있으니,
  // 키보드만큼 ScrollView가 줄어든 뒤(onLayout) 스크롤한다
  const handleScrollViewLayout = useCallback(event => {
    viewportHeightRef.current = event.nativeEvent.layout.height;

    if (isKeyboardVisible) {
      scrollToFocusedField();
    }
  }, [isKeyboardVisible, scrollToFocusedField]);

  // 키보드가 이미 올라와 있으면(다른 입력창으로 옮겨 갈 때) 바로 스크롤한다
  const focusField = useCallback(fieldRef => {
    focusedFieldRef.current = fieldRef;

    if (isKeyboardVisible) {
      scrollToFocusedField();
    }
  }, [isKeyboardVisible, scrollToFocusedField]);

  const blurField = useCallback(fieldRef => {
    if (focusedFieldRef.current === fieldRef) {
      focusedFieldRef.current = null;
    }
  }, []);

  return {
    scrollViewRef,
    handleScrollViewLayout,
    focusField,
    blurField,
  };
}
