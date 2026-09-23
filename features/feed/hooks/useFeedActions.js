import { useCallback } from 'react';

import { useGlobalOverlay } from '../../../shared/providers/GlobalOverlayProvider';
import { useFloatingBottomOffset } from '../../../shared/hooks/useFloatingBottomOffset';

import useFeedToggleMutation from './useFeedToggleMutation';

/*
 * floatingBarOffset: 화면 하단에 CommentBar처럼 떠 있는 바가 있으면
 * 그 바가 가리는 높이(바 위치 + 바 높이). 이 값이 있으면 SafeArea 가
 * 이미 바 높이에 포함돼 있으므로 그대로 사용하고,
 * 없으면 SafeArea 만큼만 띄운다.
 */
const useFeedActions = ({
  userId,
  floatingBarOffset = 0,
}) => {
  const { showToast } = useGlobalOverlay();

  const floatingBottomOffset =
    useFloatingBottomOffset();

  const bookmarkToastBottomOffset =
    floatingBarOffset > 0
      ? floatingBarOffset
      : floatingBottomOffset;

  const showFailureToast = useCallback(
    message => {
      showToast({
        message,
        bottomOffset: bookmarkToastBottomOffset,
      });
    },
    [bookmarkToastBottomOffset, showToast],
  );

  const handleLikeError = useCallback(
    () => showFailureToast('좋아요 처리에 실패했습니다.'),
    [showFailureToast],
  );

  const handleBookmarkError = useCallback(
    () => showFailureToast('북마크 처리에 실패했습니다.'),
    [showFailureToast],
  );

  const { toggle: toggleLike } = useFeedToggleMutation({
    userId,
    endpoint: 'like',
    valueKey: 'isLiked',
    countKey: 'likeCount',
    errorMessage: '좋아요 처리에 실패했습니다.',
    onError: handleLikeError,
  });

  const { toggle: toggleBookmark } = useFeedToggleMutation({
    userId,
    endpoint: 'bookmark',
    valueKey: 'isBookmarked',
    countKey: 'bookmarkCount',
    errorMessage: '북마크 처리에 실패했습니다.',
    onError: handleBookmarkError,
  });

  const handlePressBookmarkToastButton =
    useCallback(() => {
      // 북마크 화면 route가 만들어지면
      // 여기에서 navigation 처리
    }, []);

  const showBookmarkToast = useCallback(
    isAddingBookmark => {
      if (isAddingBookmark) {
        showToast({
          message: '기록을 북마크에 추가했습니다.',
          buttonText: '이동',
          onPressButton: handlePressBookmarkToastButton,
          bottomOffset: bookmarkToastBottomOffset,
        });

        return;
      }

      showToast({
        message: '기록을 북마크에서 삭제했습니다.',
        bottomOffset: bookmarkToastBottomOffset,
      });
    },
    [
      bookmarkToastBottomOffset,
      handlePressBookmarkToastButton,
      showToast,
    ],
  );

  const handlePressLike = useCallback(
    feed => {
      if (!feed?.feedId) return;

      toggleLike({
        feedId: feed.feedId,
        currentValue: feed.isLiked,
      });
    },
    [toggleLike],
  );

  // 서버 응답을 기다리지 않고 바로 토스트를 띄운다. 실패하면 되돌리고 실패 토스트로 바뀐다.
  const handlePressBookmark = useCallback(
    feed => {
      if (!feed?.feedId) return;

      const isAddingBookmark = toggleBookmark({
        feedId: feed.feedId,
        currentValue: feed.isBookmarked,
      });

      showBookmarkToast(isAddingBookmark);
    },
    [showBookmarkToast, toggleBookmark],
  );

  return {
    handlePressLike,
    handlePressBookmark,
  };
};

export default useFeedActions;