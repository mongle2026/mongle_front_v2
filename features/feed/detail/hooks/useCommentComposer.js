import {useCallback,useState} from 'react';

const useCommentComposer=({createComment})=>{
  const[replyTarget,setReplyTarget]=useState(null);
  const[replyFocusRequestKey,setReplyFocusRequestKey]=useState(0);

  // 입력 중인 글자는 CommentComposer가 들고 있고,
  // 여기서는 전송 성공 여부만 돌려준다 (실패하면 CommentComposer가 입력한 글을 되돌림)
  const handleSubmitComment=useCallback(async content=>{
    const target=replyTarget;

    // 입력창이 바로 비워지므로 답글 대상도 함께 해제하고, 실패하면 되돌린다
    setReplyTarget(null);

    try{
      await createComment({
        content,
        rootCommentId:target?.rootCommentId??null,
        replyToUserId:target?.userId??null,
      });

      return true;
    }catch{
      setReplyTarget(previous=>previous??target);
      return false;
    }
  },[createComment,replyTarget]);

  // target 은 CommentSection 이 만들어 준다:
  // 답글이 달릴 자리는 뿌리 댓글, 멘션되는 사람은 내가 누른 댓글의 작성자
  const handlePressReply=useCallback(target=>{
    if(!target?.rootCommentId)return;

    setReplyTarget({
      rootCommentId:target.rootCommentId,
      userId:target.userId,
      userCode:target.userCode,
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
