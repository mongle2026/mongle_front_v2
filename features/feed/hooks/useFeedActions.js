import {useCallback} from 'react';
import useFeedToggleMutation from './useFeedToggleMutation';

const useFeedActions=({userId})=>{
  const{
    mutate:mutateLike,
    pendingFeedIds:likePendingFeedIds,
  }=useFeedToggleMutation({
    userId,
    endpoint:'like',
    valueKey:'isLiked',
    countKey:'likeCount',
    errorMessage:'좋아요 처리에 실패했습니다.',
  });

  const{
    mutate:mutateBookmark,
    pendingFeedIds:bookmarkPendingFeedIds,
  }=useFeedToggleMutation({
    userId,
    endpoint:'bookmark',
    valueKey:'isBookmarked',
    countKey:'bookmarkCount',
    errorMessage:'북마크 처리에 실패했습니다.',
  });

  const handlePressLike=useCallback((feed,options)=>{
    if(!feed?.feedId)return;

    mutateLike({
      feedId:feed.feedId,
      nextValue:!feed.isLiked,
    },options);
  },[mutateLike]);

  const handlePressBookmark=useCallback((feed,options)=>{
    if(!feed?.feedId)return;

    mutateBookmark({
      feedId:feed.feedId,
      nextValue:!feed.isBookmarked,
    },options);
  },[mutateBookmark]);

  return{
    handlePressLike,
    handlePressBookmark,
    likePendingFeedIds,
    bookmarkPendingFeedIds,
  };
};

export default useFeedActions;