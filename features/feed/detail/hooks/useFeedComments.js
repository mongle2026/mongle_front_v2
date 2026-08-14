import { Alert } from 'react-native';
import axios from 'axios';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { resolveMediaUri } from '../../../../shared/utils/media';
import { formatDateDetail } from '../../utils/formatDate';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');

const normalizeComment = ({
  comment,
  depth,
  currentUserId,
  rootCommentId,
}) => {
  if (!comment) {
    return null;
  }

  return {
    commentId: Number(comment.commentId),
    feedId: Number(comment.feedId),
    userId: Number(comment.userId),

    userCode:
      comment.user?.userCode ??
      `user_${comment.userId}`,

    comment: comment.content ?? '',

    createdAt: comment.createdAt
      ? formatDateDetail(comment.createdAt)
      : '',

    profileImageUrl: resolveMediaUri(
      comment.user?.profileImageUrl,
    ),

    depth,

    parentCommentId:
      comment.parentCommentId != null
        ? Number(comment.parentCommentId)
        : null,

    rootCommentId:
      rootCommentId != null
        ? Number(rootCommentId)
        : null,

    isMine:
      Number(comment.userId) ===
      Number(currentUserId),
  };
};

const normalizeCommentGroups = (
  groups,
  currentUserId,
) => {
  if (!Array.isArray(groups)) {
    return [];
  }

  return groups.flatMap(root => {
    const rootId = Number(root.commentId);

    const normalizedRoot =
      normalizeComment({
        comment: root,
        depth: 0,
        currentUserId,
        rootCommentId: rootId,
      });

    const replies = Array.isArray(
      root.replies,
    )
      ? root.replies
          .map(reply =>
            normalizeComment({
              comment: reply,
              depth: 1,
              currentUserId,
              rootCommentId: rootId,
            }),
          )
          .filter(Boolean)
      : [];

    return normalizedRoot
      ? [normalizedRoot, ...replies]
      : replies;
  });
};

export default function useFeedComments({
  feedId,
  userId,
  enabled = true,
}) {
  const queryClient = useQueryClient();

  const isConfigured =
    Boolean(API_BASE_URL);

  const normalizedFeedId =
    feedId != null
      ? String(feedId)
      : '';

  const queryKey = [
    'feed-comments',
    normalizedFeedId,
    Number(userId),
  ];

  const {
    data: comments = [],
    isLoading: isLoadingComments,
    isFetching: isFetchingComments,
    isError: isCommentsError,
    error: commentsError,
    refetch: refetchComments,
  } = useQuery({
    queryKey,

    queryFn: async () => {
      const response = await axios.get(
        `${API_BASE_URL}/feed/${feedId}/comments`,
        {
          params: {
            userId,
          },
        },
      );

      return response.data;
    },

    select: data =>
      normalizeCommentGroups(
        data,
        userId,
      ),

    enabled:
      enabled &&
      isConfigured &&
      Number(feedId) > 0 &&
      Number(userId) > 0,

    staleTime: 10_000,
  });

  const createCommentMutation =
    useMutation({
      mutationFn: async ({
        content,
        parentCommentId = null,
      }) => {
        const normalizedContent =
          String(content ?? '').trim();

        if (!normalizedContent) {
          throw new Error(
            '댓글 내용이 없습니다.',
          );
        }

        const response =
          await axios.post(
            `${API_BASE_URL}/feed/${feedId}/comments`,
            {
              content:
                normalizedContent,

              ...(parentCommentId
                ? {
                    parentCommentId:
                      Number(
                        parentCommentId,
                      ),
                  }
                : {}),
            },
            {
              params: {
                userId,
              },
            },
          );

        return response.data;
      },

      onSuccess: async () => {
        await queryClient.invalidateQueries(
          {
            queryKey,
            exact: true,
          },
        );
      },

      onError: error => {
        console.warn(
          '댓글 작성에 실패했습니다.',
          error.response?.data ??
            error.message,
        );

        Alert.alert(
          '댓글 작성 실패',
          error.response?.data?.message ??
            '댓글을 작성하지 못했습니다.',
        );
      },
    });

  const deleteCommentMutation =
    useMutation({
      mutationFn: async commentId => {
        const response =
          await axios.delete(
            `${API_BASE_URL}/feed/${feedId}/comments/${commentId}`,
            {
              params: {
                userId,
              },
            },
          );

        return response.data;
      },

      onSuccess: async () => {
        await queryClient.invalidateQueries(
          {
            queryKey,
            exact: true,
          },
        );
      },

      onError: error => {
        console.warn(
          '댓글 삭제에 실패했습니다.',
          error.response?.data ??
            error.message,
        );

        Alert.alert(
          '댓글 삭제 실패',
          error.response?.data?.message ??
            '댓글을 삭제하지 못했습니다.',
        );
      },
    });

  return {
    comments,

    isConfigured,
    isLoadingComments,
    isFetchingComments,
    isCommentsError,
    commentsError,

    createComment:
      createCommentMutation.mutateAsync,

    isCreatingComment:
      createCommentMutation.isPending,

    deleteComment:
      deleteCommentMutation.mutateAsync,

    isDeletingComment:
      deleteCommentMutation.isPending,

    refetchComments,
  };
}