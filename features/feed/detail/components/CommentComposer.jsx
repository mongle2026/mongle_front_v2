import React, { memo, useCallback, useState } from 'react';

import CommentBar from './CommentBar';

/**
 * 입력 중인 댓글을 직접 들고 있는 CommentBar.
 * 글자를 칠 때마다 FeedDetailScreen 전체가 다시 그려지지 않도록
 * 입력 상태를 화면이 아닌 이 컴포넌트에 둔다.
 *
 * @param {(content: string) => Promise<boolean>} onSubmit 전송 성공이면 true (입력창을 비움)
 * 나머지 props 는 CommentBar 로 그대로 넘긴다.
 */
const CommentComposer = ({ onSubmit, ...commentBarProps }) => {
  const [text, setText] = useState('');

  const handleSubmit = useCallback(
    async content => {
      const isSubmitted = await onSubmit?.(content);

      if (isSubmitted) {
        setText('');
      }
    },
    [onSubmit],
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
