import { useCallback, useRef } from 'react';

/**
 * 댓글 알림 등으로 들어왔을 때(route.params.scrollToComment) 댓글 영역으로 자동 스크롤.
 *
 * 메뉴 닫기는 여기서 하지 않습니다.
 * 스크롤 시작 시 처리(메뉴 닫기 등)는 화면이 하고, 거기서 lockAutoScroll만 불러 주세요.
 */
const useScrollToComment = ({ shouldScrollToComment }) => {
  const scrollViewRef = useRef(null);
  const commentSectionYRef = useRef(0);
  const hasScrolledToCommentRef = useRef(false);

  // 사용자가 직접 스크롤을 시작하면 자동 스크롤을 잠근다.
  const lockAutoScroll = useCallback(() => {
    hasScrolledToCommentRef.current = true;
  }, []);

  const handleCommentSectionLayout = useCallback(
    event => {
      commentSectionYRef.current = event.nativeEvent.layout.y;

      if (!shouldScrollToComment || hasScrolledToCommentRef.current) {
        return;
      }

      // 위쪽 콘텐츠(이미지 등)의 레이아웃이 늦게 잡히며 y가 바뀔 수 있어
      // 사용자가 직접 스크롤하기 전까지는 댓글 위치로 계속 맞춰준다.
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({
          y: commentSectionYRef.current,
          animated: true,
        });
      });
    },
    [shouldScrollToComment],
  );

  return {
    scrollViewRef,
    lockAutoScroll,
    handleCommentSectionLayout,
  };
};

export default useScrollToComment;
