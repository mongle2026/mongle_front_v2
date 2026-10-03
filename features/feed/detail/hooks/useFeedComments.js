import { useCallback } from 'react';
import { Alert } from 'react-native';
import apiClient, { getApiErrorDetail, getApiErrorMessage, isApiConfigured } from '../../../../shared/api/client';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { resolveMediaUri } from '../../../../shared/utils/media';
import { formatDateDetail } from '../../../../shared/utils/dateUtils';
import { feedCommentKeys } from '../../api/feedCache';
import { hasId, isSameId } from '../../../../shared/utils/id';

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
    commentId: comment.commentId,
    feedId: comment.feedId,
    userId: comment.userId,

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

    rootCommentId:
      rootCommentId ?? null,

    isMine: isSameId(comment.userId, currentUserId),

    // 서버 응답 전에 먼저 그려 둔 댓글 (아직 id 가 없어 답글/삭제 불가)
    isPending: Boolean(comment.isPending),
  };
};

// 서버에 저장되기 전 임시 댓글 id. 실제 id 와 겹치지 않게 음수를 쓴다
let tempCommentSeq = 0;
const createTempCommentId = () => {
  tempCommentSeq += 1;
  return `temp-${tempCommentSeq}`;
};

const appendTempComment = (groups, tempComment) => {
  const list = Array.isArray(groups) ? groups : [];

  if (!tempComment.rootCommentId) {
    return [...list, { ...tempComment, replies: [] }];
  }

  return list.map(root =>
    isSameId(root.commentId, tempComment.rootCommentId)
      ? {
          ...root,
          replies: [...(root.replies ?? []), tempComment],
        }
      : root,
  );
};

const normalizeCommentGroups = (
  groups,
  currentUserId,
) => {
  if (!Array.isArray(groups)) {
    return [];
  }

  return groups.flatMap(root => {
    const rootId = root.commentId;

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
  currentUser = null,
  enabled = true,
}) {
  const queryClient = useQueryClient();

  const isConfigured =
    isApiConfigured;

  const queryKey = feedCommentKeys.list(feedId, userId);

  // select 함수가 매번 새로 만들어지면 react-query가 렌더마다 댓글을 다시 가공해서
  // 새 배열을 돌려준다 → CommentSection(memo)이 화면이 그려질 때마다 같이 다시 그려진다
  const selectComments = useCallback(
    data =>
      normalizeCommentGroups(
        data,
        userId,
      ),
    [userId],
  );

  const {
    data: comments = [],
    isLoading: isLoadingComments,
    isSuccess: isCommentsSuccess,
    isFetching: isFetchingComments,
  } = useQuery({
    queryKey,

    queryFn: async () => {
      const response = await apiClient.get(
        `/feed/${feedId}/comments`,
        {
          params: {
            userId,
          },
        },
      );

      return response.data;
    },

    select: selectComments,

    enabled:
      enabled &&
      isConfigured &&
      hasId(feedId) &&
      hasId(userId),

    staleTime: 10_000,
  });

  const createCommentMutation =
    useMutation({
      mutationFn: async ({
        content,
        rootCommentId = null,
        replyToUserId = null,
      }) => {
        const normalizedContent =
          String(content ?? '').trim();

        if (!normalizedContent) {
          throw new Error(
            '댓글 내용이 없습니다.',
          );
        }

        const response =
          await apiClient.post(
            `/feed/${feedId}/comments`,
            {
              content:
                normalizedContent,

              ...(rootCommentId
                ? {
                    rootCommentId,
                  }
                : {}),

              // 답글 알림은 답글 대상으로 고른 사람에게만 간다
              ...(rootCommentId &&
              replyToUserId
                ? {
                    replyToUserId,
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

      // 서버 응답을 기다리지 않고 내 댓글을 목록에 먼저 넣는다
      onMutate: async ({
        content,
        rootCommentId = null,
      }) => {
        const normalizedContent =
          String(content ?? '').trim();

        if (!normalizedContent) {
          return {};
        }

        // 진행 중인 목록 조회가 끝나며 임시 댓글을 덮어쓰지 않게 멈춘다
        await queryClient.cancelQueries({
          queryKey,
          exact: true,
        });

        const previousComments =
          queryClient.getQueryData(queryKey);

        const now = new Date().toISOString();

        queryClient.setQueryData(
          queryKey,
          groups =>
            appendTempComment(groups, {
              commentId: createTempCommentId(),
              feedId,
              userId,
              user: {
                userId,
                userCode: currentUser?.userCode,
                profileImageUrl:
                  currentUser?.profileImageUrl ?? null,
              },
              content: normalizedContent,
              rootCommentId: rootCommentId ?? null,
              createdAt: now,
              updatedAt: now,
              isPending: true,
            }),
        );

        return { previousComments };
      },

      onError: (error, _variables, context) => {
        if (context && 'previousComments' in context) {
          queryClient.setQueryData(
            queryKey,
            context.previousComments,
          );
        }

        console.warn(
          '댓글 작성에 실패했습니다.',
          getApiErrorDetail(error),
        );

        Alert.alert(
          '댓글 작성 실패',
          getApiErrorMessage(error, '댓글을 작성하지 못했습니다.'),
        );
      },

      // 임시 댓글을 서버 목록으로 바꿔 끼운다.
      // 기다리면 전송 완료가 그만큼 늦어지므로 await 하지 않는다
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey,
          exact: true,
        });
      },
    });

  const deleteCommentMutation =
    useMutation({
      mutationFn: async commentId => {
        const response =
          await apiClient.delete(
            `/feed/${feedId}/comments/${commentId}`,
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
          getApiErrorDetail(error),
        );

        Alert.alert(
          '댓글 삭제 실패',
          getApiErrorMessage(error, '댓글을 삭제하지 못했습니다.'),
        );
      },
    });

  return {
    comments,

    isLoadingComments,
    // 목록을 받아 왔고 다시 받아오는 중도 아니면 지금 서버 상태로 믿을 수 있다
    isCommentsSettled: isCommentsSuccess && !isFetchingComments,

    createComment:
      createCommentMutation.mutateAsync,

    isCreatingComment:
      createCommentMutation.isPending,

    deleteComment:
      deleteCommentMutation.mutateAsync,

    isDeletingComment:
      deleteCommentMutation.isPending,

  };
}