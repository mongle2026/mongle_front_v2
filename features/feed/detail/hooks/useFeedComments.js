import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function useFeedComments({
  feedId,
  userId,
  enabled = true,
}) {
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);

  const [isDeletingComment, setIsDeletingComment] = useState(false);

  const getCommentProfileSource = useCallback((profileImageUrl) => {
    if (!profileImageUrl) {
      return null;
    }

    if (profileImageUrl.startsWith('http')) {
      return { uri: profileImageUrl };
    }

    return { uri: `${API_BASE_URL}${profileImageUrl}` };
  }, []);

  const getComments = useCallback(async () => {
    if (!feedId || !userId) {
      return;
    }

    try {
      setIsLoadingComments(true);

      const { data } = await axios.get(
        `${API_BASE_URL}/feed/${feedId}/comments`,
        {
          params: {
            userId,
          },
        }
      );

      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  }, [feedId, userId]);

  const handleCreateComment = useCallback(async () => {
    const content = commentText.trim();

    if (!content || isSubmittingComment) {
      return;
    }

    try {
      setIsSubmittingComment(true);

      await axios.post(
        `${API_BASE_URL}/feed/${feedId}/comments`,
        {
          content,
          ...(replyTarget
            ? { parentCommentId: replyTarget.commentId }
            : {}),
        },
        {
          params: {
            userId,
          },
        }
      );

      setCommentText('');
      setReplyTarget(null);
      await getComments();
    } catch (error) {
      console.error(error);

      Alert.alert(
        '댓글 작성 실패',
        error.response?.data?.message ?? '댓글을 작성하지 못했습니다.'
      );
    } finally {
      setIsSubmittingComment(false);
    }
  }, [
    commentText,
    isSubmittingComment,
    feedId,
    userId,
    replyTarget,
    getComments,
  ]);

  const handleDeleteComment = useCallback(async (commentDeleteTarget) => {
    if (!commentDeleteTarget || isDeletingComment) {
      return false;
    }

    try {
      setIsDeletingComment(true);

      await axios.delete(
        `${API_BASE_URL}/feed/${feedId}/comments/${commentDeleteTarget.commentId}`,
        {
          params: {
            userId,
          },
        }
      );

      await getComments();
      return true;
    } catch (error) {
      console.error(error);

      Alert.alert(
        '댓글 삭제 실패',
        error.response?.data?.message ?? '댓글을 삭제하지 못했습니다.'
      );

      return false;
    } finally {
      setIsDeletingComment(false);
    }
  }, [
    feedId,
    userId,
    isDeletingComment,
    getComments,
  ]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    getComments();
  }, [enabled, getComments]);

  return {
    comments,
    isLoadingComments,

    commentText,
    setCommentText,
    isSubmittingComment,

    replyTarget,
    setReplyTarget,

    isDeletingComment,

    getCommentProfileSource,
    handleCreateComment,
    handleDeleteComment,
    getComments,
  };
}