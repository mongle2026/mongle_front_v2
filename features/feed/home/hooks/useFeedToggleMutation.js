import {
  useMemo,
  useState,
} from 'react';

import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import axios from 'axios';

import {
  feedHomeKeys,
  findFeedItem,
  updateFeedItem,
} from './feedHomeCache';

const API_BASE_URL =
  process.env
    .EXPO_PUBLIC_API_BASE_URL
    ?.replace(
      /\/+$/,
      '',
    );

const normalizeFeedId = feedId =>
  String(feedId);

export default function useFeedToggleMutation({
  userId,

  endpoint,
  valueKey,
  countKey,

  errorMessage,
}) {
  const queryClient =
    useQueryClient();

  /**
   * 요청 중인 게시물 ID만 관리합니다.
   * 다른 게시물의 버튼은 계속 사용할 수 있습니다.
   */
  const [
    pendingFeedIds,
    setPendingFeedIds,
  ] = useState(() => new Set());

  const userFeedQueryKey =
    useMemo(
      () =>
        feedHomeKeys.user(
          userId,
        ),
      [userId],
    );

  const mutation = useMutation({
    mutationKey: [
      'feed-home-toggle',
      String(userId),
      endpoint,
    ],

    mutationFn: async ({
      feedId,
      nextValue,
    }) => {
      if (!API_BASE_URL) {
        throw new Error(
          'EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다.',
        );
      }

      if (
        userId === null ||
        userId === undefined
      ) {
        throw new Error(
          '사용자 ID가 없습니다.',
        );
      }

      const url =
        `${API_BASE_URL}` +
        `/feed/${feedId}/${endpoint}`;

      if (nextValue) {
        return axios.post(
          url,
          null,
          {
            params: {
              userId,
            },
          },
        );
      }

      return axios.delete(
        url,
        {
          params: {
            userId,
          },
        },
      );
    },

    onMutate: async ({
      feedId,
      nextValue,
    }) => {
      const pendingId =
        normalizeFeedId(feedId);

      setPendingFeedIds(
        previousIds => {
          const nextIds =
            new Set(previousIds);

          nextIds.add(pendingId);

          return nextIds;
        },
      );

      /**
       * 현재 사용자의 추천·팔로잉 피드 요청만 취소합니다.
       * 다른 사용자의 캐시는 건드리지 않습니다.
       */
      await queryClient.cancelQueries({
        queryKey:
          userFeedQueryKey,
      });

      /**
       * 실패했을 때 필요한 필드만 복구할 수 있도록
       * value와 count만 저장합니다.
       */
      const previousStates =
        queryClient
          .getQueriesData({
            queryKey:
              userFeedQueryKey,
          })
          .map(
            ([
              queryKey,
              queryData,
            ]) => {
              const item =
                findFeedItem(
                  queryData,
                  feedId,
                );

              if (!item) {
                return null;
              }

              return {
                queryKey,
                feedId,

                previousValue:
                  Boolean(
                    item[valueKey],
                  ),

                previousCount:
                  Number(
                    item[countKey] ??
                    0,
                  ),
              };
            },
          )
          .filter(Boolean);

      /**
       * 추천·팔로잉 피드에 동일 게시물이 있을 수 있으므로
       * 현재 사용자의 모든 피드 캐시를 함께 수정합니다.
       */
      queryClient.setQueriesData(
        {
          queryKey:
            userFeedQueryKey,
        },
        previousData =>
          updateFeedItem(
            previousData,
            feedId,
            feed => ({
              ...feed,

              [valueKey]:
                nextValue,

              [countKey]:
                Math.max(
                  0,
                  Number(
                    feed[
                      countKey
                    ] ?? 0,
                  ) +
                    (
                      nextValue
                        ? 1
                        : -1
                    ),
                ),
            }),
          ),
      );

      return {
        previousStates,
      };
    },

    onError: (
      mutationError,
      variables,
      context,
    ) => {
      context
        ?.previousStates
        ?.forEach(
          ({
            queryKey,
            feedId,
            previousValue,
            previousCount,
          }) => {
            queryClient.setQueryData(
              queryKey,
              previousData =>
                updateFeedItem(
                  previousData,
                  feedId,
                  feed => ({
                    ...feed,

                    [valueKey]:
                      previousValue,

                    [countKey]:
                      previousCount,
                  }),
                ),
            );
          },
        );

      console.warn(
        errorMessage,
        mutationError,
      );
    },

    onSettled: (
      _data,
      _error,
      variables,
    ) => {
      const settledFeedId =
        variables?.feedId;

      if (
        settledFeedId !==
          null &&
        settledFeedId !==
          undefined
      ) {
        const pendingId =
          normalizeFeedId(
            settledFeedId,
          );

        setPendingFeedIds(
          previousIds => {
            const nextIds =
              new Set(
                previousIds,
              );

            nextIds.delete(
              pendingId,
            );

            return nextIds;
          },
        );
      }

      /**
       * 캐시를 stale 상태로만 변경합니다.
       * 즉시 서버 요청을 하지 않으므로
       * 새로고침 로딩 원이 나타나지 않습니다.
       */
      queryClient.invalidateQueries({
        queryKey:
          userFeedQueryKey,

        refetchType: 'none',
      });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync:
      mutation.mutateAsync,

    pendingFeedIds,
  };
}