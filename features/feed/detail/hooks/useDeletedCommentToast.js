import { useEffect, useRef } from 'react';

import { useGlobalOverlay } from '../../../../shared/providers/GlobalOverlayProvider';
import { colors } from '../../../../shared/styles/color';
import { isSameId } from '../../../../shared/utils/id';

/**
 * 댓글/답글 알림으로 들어왔는데 피드는 남아 있고 그 댓글만 지워졌으면 Toast로 알린다.
 * (피드까지 지워졌으면 FeedDetailScreen 의 삭제 Dialog가 대신 뜬다.)
 *
 * 캐시가 오래돼 다시 받아오는 중이면 그 결과를 기다렸다가 확인한다.
 * (캐시가 아직 신선하면 다시 받아오지 않으므로 캐시 목록으로 바로 확인한다.)
 * Toast가 CommentBar 위에 뜨도록 CommentBar 높이가 잡힌 뒤에 띄운다.
 */
const useDeletedCommentToast = ({
  commentId,
  isReply,
  comments,
  isCommentsSettled,
  isFeedVisible,
  bottomOffset,
  isCommentBarMeasured,
}) => {
  const { showToast } = useGlobalOverlay();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (hasCheckedRef.current || commentId == null) return;
    if (!isFeedVisible || !isCommentsSettled || !isCommentBarMeasured) return;

    hasCheckedRef.current = true;

    const isCommentAlive = comments.some(
      comment => isSameId(comment.commentId, commentId),
    );
    if (isCommentAlive) return;

    showToast({
      message: isReply ? '해당 답글은 이미 삭제되었어요.' : '해당 댓글은 이미 삭제되었어요.',
      icon: 'alert',
      iconColor: colors.fgCriticalInverted,
      bottomOffset,
    });
  }, [
    bottomOffset,
    commentId,
    comments,
    isCommentBarMeasured,
    isCommentsSettled,
    isFeedVisible,
    isReply,
    showToast,
  ]);
};

export default useDeletedCommentToast;
