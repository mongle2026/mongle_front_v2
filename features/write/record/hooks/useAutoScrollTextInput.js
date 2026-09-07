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
    const measuredHeight = Math.ceil(event.nativeEvent.contentSize.height);

    setTextInputHeight(prevHeight => {
      if (measuredHeight <= prevHeight) return prevHeight;

      const nextHeight = measuredHeight + lineHeight;

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
