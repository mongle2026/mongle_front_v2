import { useCallback, useEffect, useRef } from 'react';

// 키보드/CommentBar 바로 위에 붙지 않게 남겨 두는 여백
const VIEWPORT_MARGIN = 12;

/**
 * 답글을 달려고 누른 댓글이 키보드와 CommentBar에 가리지 않도록 스크롤한다.
 *
 * 키보드가 올라온 뒤에 실제 화면 위치를 재야 얼마나 가리는지 알 수 있어서,
 * 누른 댓글을 기억해 뒀다가 키보드가 올라오면 그때 맞춰 준다.
 * (CommentBar 높이가 바뀔 때도 다시 맞춘다 - 여러 줄 입력 등)
 */
const useScrollToReplyTarget = ({
  scrollViewRef,
  commentBarRef,
  requestKey,
  isKeyboardVisible,
  commentBarHeight,
}) => {
  const targetRef = useRef(null);
  const scrollOffsetRef = useRef(0);
  const viewportTopRef = useRef(0);

  const handleScroll = useCallback(event => {
    scrollOffsetRef.current =
      event.nativeEvent.contentOffset.y;
  }, []);

  const handleScrollViewLayout = useCallback(event => {
    viewportTopRef.current = event.nativeEvent.layout.y;
  }, []);

  // 누른 댓글의 View ref. 키보드가 올라온 다음 다시 재야 하므로
  // 좌표가 아니라 ref 자체를 들고 있는다.
  //
  // 키보드가 잠깐 내려가는 재포커스(답글 버튼 연타) 때도 대상을 유지해야 해서
  // 키보드가 내려갈 때가 아니라 입력창이 닫히거나 직접 스크롤할 때 비운다.
  const setReplyScrollTarget = useCallback(ref => {
    targetRef.current = ref ?? null;
  }, []);

  const clearReplyScrollTarget = useCallback(() => {
    targetRef.current = null;
  }, []);

  useEffect(() => {
    const scrollView = scrollViewRef.current;
    const commentBar = commentBarRef.current;
    const target = targetRef.current?.current;

    if (
      !isKeyboardVisible ||
      !scrollView ||
      !commentBar ||
      !target
    ) {
      return;
    }

    // 키보드와 CommentBar가 자리를 잡은 다음 프레임에 잰다.
    const frame = requestAnimationFrame(() => {
      // CommentBar의 윗변이 곧 화면에서 보이는 영역의 끝이다.
      commentBar.measureInWindow((commentBarX, commentBarY) => {
        target.measureInWindow((x, y, width, height) => {
          const visibleBottom =
            commentBarY - VIEWPORT_MARGIN;

          const hiddenAmount =
            y + height - visibleBottom;

          if (hiddenAmount <= 1) {
            return;
          }

          // 댓글이 보이는 영역보다 길면 위쪽(작성자)까지 밀려 올라가지 않게 막는다.
          const availableRoom = Math.max(
            0,
            y - viewportTopRef.current - VIEWPORT_MARGIN,
          );

          const scrollAmount = Math.min(
            hiddenAmount,
            availableRoom,
          );

          if (scrollAmount <= 1) {
            return;
          }

          scrollView.scrollTo({
            y: scrollOffsetRef.current + scrollAmount,
            animated: true,
          });
        });
      });
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [
    commentBarHeight,
    commentBarRef,
    isKeyboardVisible,
    requestKey,
    scrollViewRef,
  ]);

  return {
    handleScroll,
    handleScrollViewLayout,
    setReplyScrollTarget,
    clearReplyScrollTarget,
  };
};

export default useScrollToReplyTarget;
