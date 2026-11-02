import {
  useCallback,
  useRef,
  useState,
} from 'react';

/*
 * 본문을 쓰는 동안 커서가 화면(스크롤 영역 위 ~ 하단 바 위)에 보이도록 스크롤한다.
 *
 * TextInput 은 커서 좌표를 알려주지 않으므로, 커서 앞까지의 글을 같은 글꼴로
 * 보이지 않게 그린 Text(caretMirrorRef)의 아래 끝을 커서 줄의 아래 끝으로 본다.
 */
const useAutoScrollTextInput = ({
  bottomBarHeight,
  bottomBarBottom,
  lineHeight,
}) => {
  const scrollViewRef = useRef(null);
  const textInputRef = useRef(null);
  const caretMirrorRef = useRef(null);
  const scrollOffsetRef = useRef(0);
  const scrollViewportHeightRef = useRef(0);

  const [textInputHeight, setTextInputHeight] = useState(0);

  const handleScroll = useCallback(event => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const handleScrollViewLayout = useCallback(event => {
    scrollViewportHeightRef.current = event.nativeEvent.layout.height;
  }, []);

  const scrollToCaret = useCallback(() => {
    const caretMirrorNode = caretMirrorRef.current;
    const scrollNode = scrollViewRef.current;
    if (!caretMirrorNode || !scrollNode) return;

    caretMirrorNode.measureLayout(
      scrollNode,
      (x, y, width, height) => {
        const frameHeight = scrollViewportHeightRef.current;
        if (!frameHeight) return;

        const visibleViewportHeight = Math.max(0, frameHeight - bottomBarHeight - bottomBarBottom);

        const caretBottom = y + height;
        const caretTop = caretBottom - lineHeight;
        const visibleTop = scrollOffsetRef.current;
        const visibleBottom = visibleTop + visibleViewportHeight;

        if (caretBottom > visibleBottom) {
          scrollNode.scrollTo({ y: caretBottom - visibleViewportHeight, animated: true });
        } else if (caretTop < visibleTop) {
          scrollNode.scrollTo({ y: Math.max(0, caretTop), animated: true });
        }
      },
      () => {},
    );
  }, [bottomBarHeight, bottomBarBottom, lineHeight]);

  const handleTextContentSizeChange = useCallback(event => {
    const measuredHeight = event.nativeEvent.contentSize.height;

    setTextInputHeight(prevHeight => {
      /*
       * scrollEnabled={false}인 multiline TextInput은 contentSize로 minHeight(프레임 높이)를 돌려준다.
       * lineHeight가 소수(예: 25.2)면 프레임이 픽셀 단위로 반올림되어 prevHeight보다 살짝 커지고,
       * 그걸 '늘어났다'로 보면 minHeight가 끝없이 커진다. 1px 이하 차이는 무시한다.
       */
      if (measuredHeight <= prevHeight + 1) return prevHeight;

      return Math.ceil(measuredHeight + lineHeight);
    });
  }, [lineHeight]);

  return {
    scrollViewRef,
    textInputRef,
    caretMirrorRef,

    textInputHeight,

    handleScroll,
    handleScrollViewLayout,
    handleTextContentSizeChange,
    scrollToCaret,
  };
};

export default useAutoScrollTextInput;
