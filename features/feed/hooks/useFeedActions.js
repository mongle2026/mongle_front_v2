import { useCallback } from 'react';

import { useGlobalOverlay } from '../../../shared/providers/GlobalOverlayProvider';
import { useFloatingBottomOffset } from '../../../shared/hooks/useFloatingBottomOffset';

import useFeedToggleMutation from './useFeedToggleMutation';

const useFeedActions = ({ userId }) => {
  const { showToast } = useGlobalOverlay();

  const floatingBottomOffset =
    useFloatingBottomOffset();

  const {
    mutate: mutateLike,
    pendingFeedIds: likePendingFeedIds,
  } = useFeedToggleMutation({
    userId,
    endpoint: 'like',
    valueKey: 'isLiked',
    countKey: 'likeCount',
    errorMessage: '좋아요 처리에 실패했습니다.',
  });

  const {
    mutate: mutateBookmark,
    pendingFeedIds: bookmarkPendingFeedIds,
  } = useFeedToggleMutation({
    userId,
    endpoint: 'bookmark',
    valueKey: 'isBookmarked',
    countKey: 'bookmarkCount',
    errorMessage: '북마크 처리에 실패했습니다.',
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
          bottomOffset: floatingBottomOffset,
        });

        return;
      }

      showToast({
        message: '기록을 북마크에서 삭제했습니다.',
        bottomOffset: floatingBottomOffset,
      });
    },
    [
      floatingBottomOffset,
      handlePressBookmarkToastButton,
      showToast,
    ],
  );

  const handlePressLike = useCallback(
    (feed, options) => {
      if (!feed?.feedId) return;

      mutateLike(
        {
          feedId: feed.feedId,
          nextValue: !feed.isLiked,
        },
        options,
      );
    },
    [mutateLike],
  );

  const handlePressBookmark = useCallback(
    (feed, options) => {
      if (!feed?.feedId) return;

      const isAddingBookmark =
        !feed.isBookmarked;

      mutateBookmark(
        {
          feedId: feed.feedId,
          nextValue: isAddingBookmark,
        },
        {
          ...options,

          onSuccess: (...args) => {
            showBookmarkToast(
              isAddingBookmark,
            );

            options?.onSuccess?.(
              ...args,
            );
          },
        },
      );
    },
    [
      mutateBookmark,
      showBookmarkToast,
    ],
  );

  return {
    handlePressLike,
    handlePressBookmark,

    likePendingFeedIds,
    bookmarkPendingFeedIds,
  };
};

export default useFeedActions;