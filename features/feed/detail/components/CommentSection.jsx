import React, { memo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

import Empty from '../../../../shared/components/content/Empty';
import ListHeader from '../../../../shared/components/content/ListHeader';

import Comment from './Comment';

const EMPTY_COMMENT_BODY =
  '댓글은 글 작성자와 나만 볼 수 있어요.\n첫 댓글을 남겨 작성자와 이야기해보세요!';

const CommentSection = ({
  comments = [],
  isLoading = false,
  openCommentMenuId = null,
  onPressMenu,
  onPressReply,
}) => {
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
            <Comment
              key={comment.commentId}
              userCode={comment.userCode}
              comment={comment.comment}
              createdAt={comment.createdAt}
              profileImageUrl={comment.profileImageUrl}
              depth={comment.depth}
              showMenu
              isMenuOpen={isMenuOpen}
              onPressMenu={position => {
                // 남의 댓글에도 케밥 버튼은 의도적으로 노출함
                // TODO: 남의 댓글이면 신고하기 메뉴 열기
                if (!comment.isMine) return;
                onPressMenu?.(comment, position);
              }}
              onPressReply={() => onPressReply?.(comment)}
            />
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