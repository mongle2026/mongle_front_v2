import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { getApiErrorDetail } from '../../../shared/api/client';

import {
  feedDetailKeys,
  feedHomeKeys,
  findFeedItem,
  updateFeedItem,
} from '../api/feedCache';

const normalizeFeedId = feedId => String(feedId);

export default function useFeedToggleMutation({
  userId,
  endpoint,
  valueKey,
  countKey,
  errorMessage,
}) {
  const queryClient = useQueryClient();
  const [pendingFeedIds, setPendingFeedIds] = useState(() => new Set());

  const userFeedQueryKey = useMemo(() => feedHomeKeys.user(userId), [userId]);

  const mutation = useMutation({
    mutationKey: ['feed-toggle', String(userId), endpoint],

    mutationFn: async ({ feedId, nextValue }) => {
      if (userId === null || userId === undefined) throw new Error('사용자 ID가 없습니다.');

      const url = `/feed/${feedId}/${endpoint}`;

      if (nextValue) {
        return apiClient.post(url, null, { params: { userId } });
      }

      return apiClient.delete(url, { params: { userId } });
    },

    onMutate: async ({ feedId, nextValue }) => {
      const pendingId = normalizeFeedId(feedId);
      const detailQueryKey = feedDetailKeys.detail(userId, feedId);

      setPendingFeedIds(previousIds => {
        const nextIds = new Set(previousIds);
        nextIds.add(pendingId);
        return nextIds;
      });

      await Promise.all([
        queryClient.cancelQueries({ queryKey: userFeedQueryKey }),
        queryClient.cancelQueries({ queryKey: detailQueryKey }),
      ]);

      const previousHomeStates = queryClient
        .getQueriesData({ queryKey: userFeedQueryKey })
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

      const previousDetail = queryClient.getQueryData(detailQueryKey);

      const previousDetailState = previousDetail
        ? {
          previousValue: Boolean(previousDetail[valueKey]),
          previousCount: Number(previousDetail[countKey] ?? 0),
        }
        : null;

      const updateFeed = feed => ({
        ...feed,
        [valueKey]: nextValue,
        [countKey]: Math.max(0, Number(feed[countKey] ?? 0) + (nextValue ? 1 : -1)),
      });

      queryClient.setQueriesData(
        { queryKey: userFeedQueryKey },
        previousData => updateFeedItem(previousData, feedId, updateFeed),
      );

      queryClient.setQueryData(detailQueryKey, previousData => {
        if (!previousData) return previousData;
        return updateFeed(previousData);
      });

      return {
        previousHomeStates,
        previousDetailState,
      };
    },

    onError: (mutationError, variables, context) => {
      context?.previousHomeStates?.forEach(({
        queryKey,
        feedId,
        previousValue,
        previousCount,
      }) => {
        queryClient.setQueryData(
          queryKey,
          previousData => updateFeedItem(
            previousData,
            feedId,
            feed => ({
              ...feed,
              [valueKey]: previousValue,
              [countKey]: previousCount,
            }),
          ),
        );
      });

      if (context?.previousDetailState) {
        queryClient.setQueryData(
          feedDetailKeys.detail(userId, variables.feedId),
          previousData => {
            if (!previousData) return previousData;

            return {
              ...previousData,
              [valueKey]: context.previousDetailState.previousValue,
              [countKey]: context.previousDetailState.previousCount,
            };
          },
        );
      }

      console.warn(
        errorMessage,
        getApiErrorDetail(mutationError),
      );
    },

    onSettled: (_data, _error, variables) => {
      const settledFeedId = variables?.feedId;
      if (settledFeedId === null || settledFeedId === undefined) return;

      const pendingId = normalizeFeedId(settledFeedId);
      const detailQueryKey = feedDetailKeys.detail(userId, settledFeedId);

      // 상세 첫 조회 중에 토글하면 onMutate의 cancelQueries로 조회가 취소된 채 남는다.
      // 데이터가 없는 상세 쿼리는 다시 불러와 서버 상태와 맞춘다.
      if (queryClient.getQueryData(detailQueryKey) === undefined) {
        queryClient.invalidateQueries({ queryKey: detailQueryKey });
      }

      setPendingFeedIds(previousIds => {
        const nextIds = new Set(previousIds);
        nextIds.delete(pendingId);
        return nextIds;
      });
    },
  });

  return {
    mutate: mutation.mutate,
    pendingFeedIds,
  };
}