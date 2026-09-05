import {
  useCallback,
  useRef,
  useState,
} from 'react';

/*
 * 커서가 있는 마지막 줄이 measuredHeight 딱 그 경계에
 * 걸쳐 있으면, 네이티브 쪽 relayout이 한 프레임 늦게
 * 반영되는 순간 커서가 렌더링된 영역 밖으로 벗어나
 * Android가 스크롤을 튕겼다가 되돌리는 현상이 생깁니다.
 * 항상 한 줄만큼 여유 공간을 남겨 커서가 경계에 걸치는
 * 상황 자체를 없앱니다.
 *
 * 또한 본문이 길어져 입력창이 커질 때, TextInput 아래쪽 끝이
 * 현재 보이는 영역을 벗어난 경우에만 그 끝이 딱 보이는 위치까지
 * 스크롤합니다. scrollToEnd를 쓰면 아래에 붙어 있는 사진 목록까지
 * 같이 내려가버리므로, TextInput의 실제 위치를 측정해 그 범위
 * 안에서만 스크롤합니다.
 */
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

        /*
         * ScrollView 프레임 자체는 키보드가 올라와도 줄어들지 않고,
         * 떠 있는 BottomBar(bottomBarHeight)가 키보드 바로 위(bottomOffset)에
         * 겹쳐 화면 아래쪽을 가립니다. 실제로 사용자 눈에 보이는 높이는
         * 그만큼을 뺀 값입니다.
         */
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
    const nextHeight = measuredHeight + lineHeight;

    setTextInputHeight(prevHeight => {
      if (Math.abs(prevHeight - nextHeight) < 1) return prevHeight;

      /*
       * 본문이 길어져 입력창이 커지는 경우에만 스크롤을 아래로
       * 따라가게 합니다. 레이아웃 반영 이후에 스크롤해야
       * 새로 늘어난 영역까지 정확히 내려가므로 한 프레임 뒤로 미룹니다.
       */
      if (nextHeight > prevHeight) {
        requestAnimationFrame(scrollToKeepTextInputVisible);
      }

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
