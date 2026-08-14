import {useCallback,useState} from 'react';

const useCommentComposer=({createComment})=>{
  const[commentText,setCommentText]=useState('');
  const[replyTarget,setReplyTarget]=useState(null);
  const[replyFocusRequestKey,setReplyFocusRequestKey]=useState(0);

  const handleSubmitComment=useCallback(async content=>{
    try{
      await createComment({
        content,
        parentCommentId:replyTarget?.commentId??null,
      });

      setCommentText('');
      setReplyTarget(null);
    }catch{}
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

  return{
    commentText,
    setCommentText,
    replyTarget,
    replyFocusRequestKey,
    handleSubmitComment,
    handlePressReply,
  };
};

export default useCommentComposer;