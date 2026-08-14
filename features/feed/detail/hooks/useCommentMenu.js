import {useCallback,useRef,useState} from 'react';
import {StyleSheet,useWindowDimensions} from 'react-native';
import {Dialog} from '../../../../shared/components/action/Dialog';
import {useGlobalOverlay} from '../../../../shared/components/layout/GlobalOverlayProvider';
import {padding} from '../../../../shared/styles/token';

const useCommentMenu=({
  commentBarRef,
  commentBarHeight,
  floatingBottomOffset,
  deleteComment,
  isDeletingComment,
})=>{
  const{openOverlay,showToast}=useGlobalOverlay();
  const{height:windowHeight}=useWindowDimensions();
  const commentMenuOverlayRef=useRef(null);
  const[commentMenu,setCommentMenu]=useState(null);

  const closeCommentMenu=useCallback(()=>{
    setCommentMenu(null);
  },[]);

  const handlePressCommentMenu=useCallback((comment,anchor)=>{
    if(!comment?.commentId||!anchor)return;
    setCommentMenu(previous=>{
      const isSameComment=
        previous?.comment?.commentId!=null&&
        String(previous.comment.commentId)===String(comment.commentId);

      if(isSameComment)return null;

      return{
        comment,
        anchor,
        top:0,
        isMeasured:false,
      };
    });
  },[]);

  const handleCommentMenuLayout=useCallback(event=>{
    const menuHeight=event.nativeEvent.layout.height;

    const updateMenuPosition=(overlayY,commentBarTop)=>{
      setCommentMenu(previous=>{
        if(!previous)return previous;

        const anchorTop=previous.anchor.y;
        const anchorBottom=
          previous.anchor.y+
          previous.anchor.height;
        const belowBottom=
          anchorBottom+
          menuHeight;

        const shouldOpenAbove=
          belowBottom>commentBarTop;

        const menuTopInWindow=
          shouldOpenAbove
            ?anchorTop-menuHeight
            :anchorBottom;

        const menuTopInOverlay=Math.max(
          0,
          menuTopInWindow-overlayY,
        );

        if(
          previous.isMeasured&&
          previous.top===menuTopInOverlay
        ){
          return previous;
        }

        return{
          ...previous,
          top:menuTopInOverlay,
          isMeasured:true,
        };
      });
    };

    const measurePosition=overlayY=>{
      if(commentBarRef.current){
        commentBarRef.current.measureInWindow((x,y)=>{
          updateMenuPosition(overlayY,y);
        });
        return;
      }

      updateMenuPosition(
        overlayY,
        windowHeight-
          floatingBottomOffset-
          commentBarHeight,
      );
    };

    if(commentMenuOverlayRef.current){
      commentMenuOverlayRef.current.measureInWindow((x,y)=>{
        measurePosition(y);
      });
      return;
    }

    measurePosition(0);
  },[
    commentBarHeight,
    commentBarRef,
    floatingBottomOffset,
    windowHeight,
  ]);

  const handlePressDeleteComment=useCallback(()=>{
    if(!commentMenu?.comment||isDeletingComment)return;

    const targetComment=commentMenu.comment;
    closeCommentMenu();

    openOverlay({
      id:'comment-delete-dialog',
      closeOnDimPress:true,
      closeOnBackPress:true,
      accessibilityLabel:'댓글 삭제 확인 창 닫기',
      contentContainerStyle:styles.dialogOverlayContent,
      renderContent:({close})=>(
        <Dialog
          title="댓글을 영구 삭제할까요?"
          description="삭제한 댓글은 다시 되돌릴 수 없습니다."
          cancelText="취소"
          confirmText="삭제"
          onCancel={close}
          onConfirm={async()=>{
            close();
            try{
              await deleteComment(targetComment.commentId);
              showToast({
                message:'댓글을 삭제했습니다.',
                bottomOffset:
                  floatingBottomOffset
              });
            }catch{}
          }}
        />
      ),
    });
  },[
    closeCommentMenu,
    commentBarHeight,
    commentMenu,
    deleteComment,
    floatingBottomOffset,
    isDeletingComment,
    openOverlay,
    showToast,
  ]);

  return{
    commentMenu,
    commentMenuOverlayRef,
    closeCommentMenu,
    handlePressCommentMenu,
    handleCommentMenuLayout,
    handlePressDeleteComment,
  };
};

const styles=StyleSheet.create({
  dialogOverlayContent:{
    top:0,
    right:0,
    bottom:0,
    left:0,
    paddingHorizontal:padding.XL,
    justifyContent:'center',
    alignItems:'center',
  },
});

export default useCommentMenu;