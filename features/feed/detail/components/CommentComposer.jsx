import React, { memo, useCallback, useState } from 'react';

import CommentBar from './CommentBar';

/**
 * 입력 중인 댓글을 직접 들고 있는 CommentBar.
 * 글자를 칠 때마다 FeedDetailScreen 전체가 다시 그려지지 않도록
 * 입력 상태를 화면이 아닌 이 컴포넌트에 둔다.
 *
 * @param {(content: string) => Promise<boolean>} onSubmit 전송 성공이면 true
 * @param {() => boolean} [canSubmit] false 면 보내지 않고 입력한 글을 그대로 둔다 (예: 로그인 전)
 * 나머지 props 는 CommentBar 로 그대로 넘긴다.
 */
const CommentComposer = ({ onSubmit, canSubmit, ...commentBarProps }) => {
  const [text, setText] = useState('');

  const handleSubmit = useCallback(
    async content => {
      if (canSubmit && !canSubmit()) return;

      // 댓글은 목록에 먼저 그려지므로 입력창도 바로 비우고,
      // 전송에 실패하면 쓰던 글을 되돌려 준다
      setText('');

      const isSubmitted = await onSubmit?.(content);

      if (!isSubmitted) {
        setText(previous => previous || content);
      }
    },
    [canSubmit, onSubmit],
  );

  return (
    <CommentBar
      {...commentBarProps}
      value={text}
      onChangeText={setText}
      onSubmit={handleSubmit}
    />
  );
};

export default memo(CommentComposer);
