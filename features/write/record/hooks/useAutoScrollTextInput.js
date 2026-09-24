import {
  useCallback,
  useRef,
  useState,
} from 'react';

const useAutoScrollTextInput = ({
  bottomBarHeight,
  bottomOffset,
  lineHeight,
}) => {
  const scrollViewRef = useRef(null);
  const textInputRef = useRef(null);
  const scrollOffsetRef = useRef(0);
  const scrollViewportHeightRef = useRef(0);

  const [textInputHeight, setTextInputHeight] = useState(0);

  const handleScroll = useCallback(event => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const handleScrollViewLayout = useCallback(event => {
    scrollViewportHeightRef.current = event.nativeEvent.layout.height;
  }, []);

  const scrollToKeepTextInputVisible = useCallback(() => {
    const textInputNode = textInputRef.current;
    const scrollNode = scrollViewRef.current;
    if (!textInputNode || !scrollNode) return;

    textInputNode.measureLayout(
      scrollNode,
      (x, y, width, height) => {
        const frameHeight = scrollViewportHeightRef.current;
        if (!frameHeight) return;

        const visibleViewportHeight = Math.max(0, frameHeight - bottomBarHeight - bottomOffset);

        const bottomEdge = y + height;
        const visibleBottom = scrollOffsetRef.current + visibleViewportHeight;

        if (bottomEdge > visibleBottom) {
          scrollNode.scrollTo({ y: bottomEdge - visibleViewportHeight, animated: true });
        }
      },
      () => {},
    );
  }, [bottomBarHeight, bottomOffset]);

  const handleTextContentSizeChange = useCallback(event => {
    const measuredHeight = event.nativeEvent.contentSize.height;

    setTextInputHeight(prevHeight => {
      /*
       * scrollEnabled={false}인 multiline TextInput은 contentSize로 minHeight(프레임 높이)를 돌려준다.
       * lineHeight가 소수(예: 25.2)면 프레임이 픽셀 단위로 반올림되어 prevHeight보다 살짝 커지고,
       * 그걸 '늘어났다'로 보면 minHeight가 끝없이 커진다. 1px 이하 차이는 무시한다.
       */
      if (measuredHeight <= prevHeight + 1) return prevHeight;

      const nextHeight = Math.ceil(measuredHeight + lineHeight);

      requestAnimationFrame(scrollToKeepTextInputVisible);

      return nextHeight;
    });
  }, [lineHeight, scrollToKeepTextInputVisible]);

  return {
    scrollViewRef,
    textInputRef,

    textInputHeight,

    handleScroll,
    handleScrollViewLayout,
    handleTextContentSizeChange,
  };
};

export default useAutoScrollTextInput;
