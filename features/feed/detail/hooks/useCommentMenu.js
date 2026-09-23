import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dialog } from '../../../../shared/components/action/Dialog';
import { useDialog } from '../../../../shared/providers/DialogProvider';
import { useGlobalOverlay } from '../../../../shared/providers/GlobalOverlayProvider';

const useCommentMenu = ({
  commentBarRef,
  commentBarHeight,
  commentBarBottom,
  isKeyboardVisible,
  deleteComment,
  isDeletingComment,
}) => {
  const { openDialog } = useDialog();
  const { showToast } = useGlobalOverlay();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const commentMenuOverlayRef = useRef(null);
  const [commentMenu, setCommentMenu] = useState(null);

  const closeCommentMenu = useCallback(() => {
    setCommentMenu(null);
  }, []);

  // measureAnchor: 케밥 버튼의 화면 위치를 재는 함수 (Comment가 넘겨준다).
  // 좌표를 한 번만 받아 두면 키보드가 내려가며 바뀐 레이아웃을 따라가지 못해서,
  // 레이아웃이 바뀔 때마다 이 함수로 다시 잰다.
  const handlePressCommentMenu = useCallback((comment, measureAnchor) => {
    if (!comment?.commentId || !measureAnchor) return;

    // 메뉴 위치는 키보드가 내려간 화면 기준으로 잡는다.
    Keyboard.dismiss();

    setCommentMenu(previous => {
      const isSameComment =
        previous?.comment?.commentId != null &&
        String(previous.comment.commentId) === String(comment.commentId);

      if (isSameComment) return null;

      return {
        comment,
        measureAnchor,
        menuHeight: 0,
        layoutKey: 0,
        top: 0,
        isMeasured: false,
      };
    });
  }, []);

  const handleCommentMenuLayout = useCallback(event => {
    const menuHeight = event.nativeEvent.layout.height;

    setCommentMenu(previous => {
      if (!previous || previous.menuHeight === menuHeight) return previous;

      return {
        ...previous,
        menuHeight,
      };
    });
  }, []);

  // 메뉴가 열린 채로 스크롤 위치가 바뀌면(키보드가 내려가며 ScrollView가
  // 스크롤을 당기는 경우 등) 위치를 다시 재도록 알린다.
  const refreshCommentMenuPosition = useCallback(() => {
    setCommentMenu(previous => {
      if (!previous) return previous;

      return {
        ...previous,
        layoutKey: previous.layoutKey + 1,
      };
    });
  }, []);

  const measureAnchor = commentMenu?.measureAnchor;
  const menuHeight = commentMenu?.menuHeight ?? 0;
  const layoutKey = commentMenu?.layoutKey ?? 0;

  // 키보드가 내려가 레이아웃이 바뀐 게 화면에 반영된 뒤(effect)에 잰다.
  // 입력창 높이가 뒤늦게 바뀌어도 다시 재서 따라간다.
  useEffect(() => {
    if (!measureAnchor || menuHeight <= 0 || isKeyboardVisible) return;

    let isCancelled = false;

    const updateMenuPosition = (anchor, overlayY, commentBarTop) => {
      if (isCancelled) return;

      const anchorTop = anchor.y;
      const anchorBottom = anchor.y + anchor.height;
      const belowBottom = anchorBottom + menuHeight;

      const shouldOpenAbove = belowBottom > commentBarTop;

      const menuTopInWindow = shouldOpenAbove
        ? anchorTop - menuHeight
        : anchorBottom;

      const menuTopInOverlay = Math.max(0, menuTopInWindow - overlayY);

      setCommentMenu(previous => {
        if (!previous || previous.measureAnchor !== measureAnchor) {
          return previous;
        }

        if (previous.isMeasured && previous.top === menuTopInOverlay) {
          return previous;
        }

        return {
          ...previous,
          top: menuTopInOverlay,
          isMeasured: true,
        };
      });
    };

    const measureCommentBar = (anchor, overlayY) => {
      if (commentBarRef.current) {
        commentBarRef.current.measureInWindow((x, y) => {
          updateMenuPosition(anchor, overlayY, y);
        });
        return;
      }

      updateMenuPosition(
        anchor,
        overlayY,
        windowHeight - commentBarBottom - commentBarHeight,
      );
    };

    const measureOverlay = anchor => {
      if (commentMenuOverlayRef.current) {
        commentMenuOverlayRef.current.measureInWindow((x, y) => {
          measureCommentBar(anchor, y);
        });
        return;
      }

      measureCommentBar(anchor, 0);
    };

    // 키보드가 내려간 직후에는 ScrollView가 몇 프레임 늦게 스크롤을 당겨서
    // 케밥 위치가 한 번 더 바뀐다. 두 프레임 연속 같은 위치가 나올 때까지 재서
    // 메뉴가 엉뚱한 곳에 잠깐 보이지 않게 한다.
    const MAX_SETTLE_FRAMES = 10;
    let frame = null;
    let previousY = null;
    let frameCount = 0;

    const measureUntilSettled = () => {
      frame = requestAnimationFrame(() => {
        measureAnchor(anchor => {
          if (isCancelled) return;

          frameCount += 1;

          const isSettled = previousY === anchor.y;

          if (isSettled || frameCount >= MAX_SETTLE_FRAMES) {
            measureOverlay(anchor);
            return;
          }

          previousY = anchor.y;
          measureUntilSettled();
        });
      });
    };

    measureUntilSettled();

    return () => {
      isCancelled = true;

      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
    };
  }, [
    commentBarHeight,
    commentBarRef,
    commentBarBottom,
    isKeyboardVisible,
    layoutKey,
    measureAnchor,
    menuHeight,
    windowHeight,
  ]);

  const handlePressDeleteComment = useCallback(() => {
    if (!commentMenu?.comment || isDeletingComment) return;

    const targetComment = commentMenu.comment;

    closeCommentMenu();

    openDialog({
      id: 'comment-delete-dialog',
      closeOnDimPress: true,
      closeOnBackPress: true,
      accessibilityLabel: '댓글 삭제 확인 창 닫기',
      renderContent: ({ close }) => (
        <Dialog
          title="댓글을 영구 삭제할까요?"
          description="삭제한 댓글은 다시 되돌릴 수 없습니다."
          cancelText="닫기"
          confirmText="삭제"
          onCancel={close}
          onConfirm={async () => {
            close();

            try {
              await deleteComment(targetComment.commentId);

              showToast({
                message: '댓글을 삭제했습니다.',
                bottomOffset: insets.bottom,
              });
            } catch { }
          }}
        />
      ),
    });
  }, [
    closeCommentMenu,
    commentMenu,
    deleteComment,
    insets.bottom,
    isDeletingComment,
    openDialog,
    showToast,
  ]);

  return {
    commentMenu,
    commentMenuOverlayRef,
    closeCommentMenu,
    handlePressCommentMenu,
    handleCommentMenuLayout,
    handlePressDeleteComment,
    refreshCommentMenuPosition,
  };
};

export default useCommentMenu;