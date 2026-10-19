import React, { memo, useCallback, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';

import Empty from '../../../../shared/components/content/Empty';
import ListHeader from '../../../../shared/components/content/ListHeader';

import Comment from './Comment';

/*
 * 방금 보낸 댓글(서버 저장 전 임시 댓글)은 위에서 살짝 내려오며 나타나고,
 * 그 아래 댓글들은 자리를 내주며 부드럽게 밀려난다. 삭제된 댓글은 흐려지며 빠진다.
 *
 * 임시 댓글이 서버 댓글로 바뀔 때는 key(id)가 바뀌어 새로 그려지는데,
 * 같은 자리에서 바로 바뀌어야 하므로 그때는 나타남 · 사라짐 애니메이션을 주지 않는다.
 */
const NEW_COMMENT_ENTERING = FadeInDown.duration(280)
  .easing(Easing.out(Easing.cubic))
  .withInitialValues({ opacity: 0, transform: [{ translateY: -10 }] });
const DELETED_COMMENT_EXITING = FadeOut.duration(180);
const COMMENT_LAYOUT_TRANSITION = LinearTransition.duration(240).easing(Easing.out(Easing.cubic));

const EMPTY_COMMENT_BODY =
  '댓글은 글 작성자와 나만 볼 수 있어요.\n첫 댓글을 남겨 작성자와 이야기해보세요!';

const CommentSection = ({
  comments = [],
  isLoading = false,
  openCommentMenuId = null,
  onPressMenu,
  onPressReply,
  // 방금 작성한(서버 저장 전) 댓글이 자리를 잡으면 그 View 를 넘긴다 → 화면이 그 댓글로 스크롤
  onNewCommentLayout,
}) => {
  // 임시 댓글마다 한 번만 알린다 (같은 댓글의 레이아웃이 다시 바뀌어도 또 스크롤하지 않게)
  const revealedCommentIdsRef = useRef(new Set());
  const commentViewsRef = useRef(new Map());

  const handlePendingCommentLayout = useCallback(
    commentId => {
      const key = String(commentId);
      if (revealedCommentIdsRef.current.has(key)) return;

      const view = commentViewsRef.current.get(key);
      if (!view) return;

      revealedCommentIdsRef.current.add(key);
      onNewCommentLayout?.(view);
    },
    [onNewCommentLayout],
  );

  const commentsById = useMemo(
    () =>
      new Map(
        comments.map(comment => [
          String(comment.commentId),
          comment,
        ]),
      ),
    [comments],
  );

  // 답글은 답글에 다시 달 수 없으므로, 달리는 위치는 언제나 뿌리 댓글이다.
  // 다만 @멘션은 내가 실제로 누른 댓글의 작성자를 가리킨다.
  const resolveReplyTarget = comment => {
    const root =
      comment.depth === 0 || comment.rootCommentId == null
        ? comment
        : commentsById.get(String(comment.rootCommentId)) ?? comment;

    return {
      rootCommentId: root.commentId,
      userId: comment.userId,
      userCode: comment.userCode,
    };
  };

  return (
    <View>
      <ListHeader title="댓글" />

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      ) : comments.length === 0 ? (
        <Empty type="comment" body={EMPTY_COMMENT_BODY} />
      ) : (
        comments.map(comment => {
          const isMenuOpen =
            comment.isMine &&
            openCommentMenuId != null &&
            String(openCommentMenuId) === String(comment.commentId);

          return (
            <Animated.View
              key={comment.commentId}
              ref={view => {
                const key = String(comment.commentId);
                if (view) commentViewsRef.current.set(key, view);
                else commentViewsRef.current.delete(key);
              }}
              onLayout={
                comment.isPending
                  ? () => handlePendingCommentLayout(comment.commentId)
                  : undefined
              }
              entering={comment.isPending ? NEW_COMMENT_ENTERING : undefined}
              exiting={comment.isPending ? undefined : DELETED_COMMENT_EXITING}
              layout={COMMENT_LAYOUT_TRANSITION}
            >
              <Comment
                userCode={comment.userCode}
                comment={comment.comment}
                createdAt={comment.createdAt}
                profileImageUrl={comment.profileImageUrl}
                depth={comment.depth}
                showMenu
                isMenuOpen={isMenuOpen}
                onPressMenu={measureAnchor => {
                  // 남의 댓글에도 케밥 버튼은 의도적으로 노출함
                  // TODO: 남의 댓글이면 신고하기 메뉴 열기
                  if (!comment.isMine) return;
                  // 아직 저장 중인 댓글은 id 가 없어 삭제할 수 없다
                  if (comment.isPending) return;
                  onPressMenu?.(comment, measureAnchor);
                }}
                onPressReply={commentRef => {
                  // 저장 중인 댓글은 답글을 묶을 원댓글 id 가 아직 없다
                  if (comment.isPending) return;
                  onPressReply?.(resolveReplyTarget(comment), commentRef);
                }}
              />
            </Animated.View>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loading: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default memo(CommentSection);
