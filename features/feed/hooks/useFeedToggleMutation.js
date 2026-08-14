import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import {
  feedHomeKeys,
  findFeedItem,
  updateFeedItem,
} from '../home/hooks/feedHomeCache';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');

const normalizeFeedId = feedId => String(feedId);

const getFeedDetailKey = (feedId, userId) => [
  'feed-detail',
  String(feedId),
  userId,
];

export default function useFeedToggleMutation({
  userId,
  endpoint,
  valueKey,
  countKey,
  errorMessage,
}) {
  const queryClient = useQueryClient();
  const [pendingFeedIds, setPendingFeedIds] = useState(() => new Set());

  const userFeedQueryKey = useMemo(
    () => feedHomeKeys.user(userId),
    [userId],
  );

  const mutation = useMutation({
    mutationKey: [
      'feed-toggle',
      String(userId),
      endpoint,
    ],

    mutationFn: async ({ feedId, nextValue }) => {
      if (!API_BASE_URL) {
        throw new Error(
          'EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다.',
        );
      }

      if (userId === null || userId === undefined) {
        throw new Error('사용자 ID가 없습니다.');
      }

      const url = `${API_BASE_URL}/feed/${feedId}/${endpoint}`;

      if (nextValue) {
        return axios.post(url, null, {
          params: { userId },
        });
      }

      return axios.delete(url, {
        params: { userId },
      });
    },

    onMutate: async ({ feedId, nextValue }) => {
      const pendingId = normalizeFeedId(feedId);
      const detailQueryKey = getFeedDetailKey(feedId, userId);

      setPendingFeedIds(previousIds => {
        const nextIds = new Set(previousIds);
        nextIds.add(pendingId);
        return nextIds;
      });

      await Promise.all([
        queryClient.cancelQueries({
          queryKey: userFeedQueryKey,
        }),
        queryClient.cancelQueries({
          queryKey: detailQueryKey,
        }),
      ]);

      const previousHomeStates = queryClient
        .getQueriesData({
          queryKey: userFeedQueryKey,
        })
        .map(([queryKey, queryData]) => {
          const item = findFeedItem(queryData, feedId);

          if (!item) return null;

          return {
            queryKey,
            feedId,
            previousValue: Boolean(item[valueKey]),
            previousCount: Number(item[countKey] ?? 0),
          };
        })
        .filter(Boolean);

      const previousDetail = queryClient.getQueryData(
        detailQueryKey,
      );

      const previousDetailState = previousDetail
        ? {
            previousValue: Boolean(previousDetail[valueKey]),
            previousCount: Number(previousDetail[countKey] ?? 0),
          }
        : null;

      const updateFeed = feed => ({
        ...feed,
        [valueKey]: nextValue,
        [countKey]: Math.max(
          0,
          Number(feed[countKey] ?? 0) + (nextValue ? 1 : -1),
        ),
      });

      queryClient.setQueriesData(
        {
          queryKey: userFeedQueryKey,
        },
        previousData =>
          updateFeedItem(
            previousData,
            feedId,
            updateFeed,
          ),
      );

      queryClient.setQueryData(
        detailQueryKey,
        previousData => {
          if (!previousData) return previousData;
          return updateFeed(previousData);
        },
      );

      return {
        previousHomeStates,
        previousDetailState,
      };
    },

    onError: (
      mutationError,
      variables,
      context,
    ) => {
      context?.previousHomeStates?.forEach(
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
                  [valueKey]: previousValue,
                  [countKey]: previousCount,
                }),
              ),
          );
        },
      );

      if (context?.previousDetailState) {
        queryClient.setQueryData(
          getFeedDetailKey(variables.feedId, userId),
          previousData => {
            if (!previousData) return previousData;

            return {
              ...previousData,
              [valueKey]:
                context.previousDetailState.previousValue,
              [countKey]:
                context.previousDetailState.previousCount,
            };
          },
        );
      }

      console.warn(
        errorMessage,
        mutationError.response?.data ?? mutationError.message,
      );
    },

    onSettled: (_data, _error, variables) => {
      const settledFeedId = variables?.feedId;

      if (
        settledFeedId !== null &&
        settledFeedId !== undefined
      ) {
        const pendingId = normalizeFeedId(settledFeedId);

        setPendingFeedIds(previousIds => {
          const nextIds = new Set(previousIds);
          nextIds.delete(pendingId);
          return nextIds;
        });

        queryClient.invalidateQueries({
          queryKey: getFeedDetailKey(
            settledFeedId,
            userId,
          ),
          refetchType: 'none',
        });
      }

      queryClient.invalidateQueries({
        queryKey: userFeedQueryKey,
        refetchType: 'none',
      });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    pendingFeedIds,
  };
}