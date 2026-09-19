import {useCallback,useState} from 'react';

const useCommentComposer=({createComment})=>{
  const[replyTarget,setReplyTarget]=useState(null);
  const[replyFocusRequestKey,setReplyFocusRequestKey]=useState(0);

  // 입력 중인 글자는 CommentComposer가 들고 있고,
  // 여기서는 전송 성공 여부만 돌려준다 (성공하면 CommentComposer가 입력창을 비움)
  const handleSubmitComment=useCallback(async content=>{
    try{
      await createComment({
        content,
        parentCommentId:replyTarget?.commentId??null,
      });

      setReplyTarget(null);
      return true;
    }catch{
      return false;
    }
  },[createComment,replyTarget]);

  const handlePressReply=useCallback(comment=>{
    if(!comment?.commentId)return;

    setReplyTarget({
      commentId:comment.commentId,
      userId:comment.userId,
      userCode:comment.userCode,
    });

    setReplyFocusRequestKey(previous=>previous+1);
  },[]);

  // 입력창이 닫히면 답글 대상도 해제해서
  // 다음 댓글이 답글로 전송되지 않게 함
  const clearReplyTarget=useCallback(()=>{
    setReplyTarget(null);
  },[]);

  return{
    replyTarget,
    replyFocusRequestKey,
    handleSubmitComment,
    handlePressReply,
    clearReplyTarget,
  };
};

export default useCommentComposer;