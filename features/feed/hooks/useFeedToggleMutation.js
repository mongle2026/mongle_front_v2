import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient, { getApiErrorDetail } from '../../../shared/api/client';

import {
  feedDetailKeys,
  feedHomeKeys,
  findFeedItemInHomeCache,
  updateFeedItem,
} from '../api/feedCache';

// 마지막 탭 이후 이 시간 동안 입력이 없으면 최종 상태만 서버에 보낸다
const SYNC_DELAY = 400;

const normalizeFeedId = feedId => String(feedId);

/*
 * 좋아요/북마크 토글.
 * 탭하면 캐시(화면)만 즉시 바꾸고, 서버 요청은 연타가 끝난 뒤 최종 값 하나만 보낸다.
 * 최종 값이 서버에 반영된 값과 같으면(짝수 번 탭) 요청을 보내지 않는다.
 * 버튼을 잠그지 않으므로 요청 중에도 애니메이션/햅틱이 그대로 동작한다.
 */
export default function useFeedToggleMutation({
  userId,
  endpoint,
  valueKey,
  countKey,
  errorMessage,
  onError,
}) {
  const queryClient = useQueryClient();

  // feedId -> { confirmedValue, desiredValue, timer, inFlight }
  const syncStatesRef = useRef(new Map());

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const userFeedQueryKey = useMemo(() => feedHomeKeys.user(userId), [userId]);

  const readCachedValue = useCallback(
    feedId => {
      const detail = queryClient.getQueryData(feedDetailKeys.detail(userId, feedId));
      if (detail) return Boolean(detail[valueKey]);

      const homeItem = findFeedItemInHomeCache(queryClient, userId, feedId);
      if (homeItem) return Boolean(homeItem[valueKey]);

      return null;
    },
    [queryClient, userId, valueKey],
  );

  const writeCachedValue = useCallback(
    (feedId, nextValue) => {
      const updateFeed = feed => {
        if (Boolean(feed[valueKey]) === nextValue) return feed;

        return {
          ...feed,
          [valueKey]: nextValue,
          [countKey]: Math.max(0, Number(feed[countKey] ?? 0) + (nextValue ? 1 : -1)),
        };
      };

      queryClient.setQueriesData(
        { queryKey: userFeedQueryKey },
        previousData => updateFeedItem(previousData, feedId, updateFeed),
      );

      queryClient.setQueryData(feedDetailKeys.detail(userId, feedId), previousData => {
        if (!previousData) return previousData;
        return updateFeed(previousData);
      });
    },
    [countKey, queryClient, userFeedQueryKey, userId, valueKey],
  );

  const sync = useCallback(
    feedId => {
      const syncStates = syncStatesRef.current;
      const state = syncStates.get(feedId);
      if (!state || state.inFlight) return;

      state.timer = null;

      if (state.desiredValue === state.confirmedValue) {
        syncStates.delete(feedId);
        return;
      }

      const requestValue = state.desiredValue;
      const url = `/feed/${feedId}/${endpoint}`;
      const params = { params: { userId } };

      state.inFlight = true;

      const request = requestValue
        ? apiClient.post(url, null, params)
        : apiClient.delete(url, params);

      request
        .then(() => {
          state.confirmedValue = requestValue;
        })
        .catch(requestError => {
          console.warn(errorMessage, getApiErrorDetail(requestError));

          // 요청 중에 다시 탭했다면 그 입력을 살리고 다음 동기화에 맡긴다
          if (state.timer) return;

          state.desiredValue = state.confirmedValue;
          writeCachedValue(feedId, state.confirmedValue);
          onErrorRef.current?.(requestError);
        })
        .finally(() => {
          state.inFlight = false;

          // 상세 첫 조회 중에 토글하면 cancelQueries로 조회가 취소된 채 남는다.
          // 데이터가 없는 상세 쿼리는 다시 불러와 서버 상태와 맞춘다.
          const detailQueryKey = feedDetailKeys.detail(userId, feedId);
          if (queryClient.getQueryData(detailQueryKey) === undefined) {
            queryClient.invalidateQueries({ queryKey: detailQueryKey });
          }

          // 요청 중에 들어온 탭은 타이머가 끝나면 알아서 동기화된다
          if (!state.timer) sync(feedId);
        });
    },
    [endpoint, errorMessage, queryClient, userId, writeCachedValue],
  );

  const applyToggle = useCallback(
    (feedId, fallbackValue) => {
      if (userId === null || userId === undefined) {
        console.warn(errorMessage, '사용자 ID가 없습니다.');
        return;
      }

      const currentValue = readCachedValue(feedId) ?? fallbackValue;
      const nextValue = !currentValue;

      const syncStates = syncStatesRef.current;
      let state = syncStates.get(feedId);

      if (!state) {
        // 진행 중인 동기화가 없으면 지금 캐시 값이 곧 서버 값이다
        state = { confirmedValue: currentValue, desiredValue: currentValue, timer: null, inFlight: false };
        syncStates.set(feedId, state);
      }

      state.desiredValue = nextValue;
      writeCachedValue(feedId, nextValue);

      if (state.timer) clearTimeout(state.timer);
      state.timer = setTimeout(() => sync(feedId), SYNC_DELAY);
    },
    [errorMessage, readCachedValue, sync, userId, writeCachedValue],
  );

  // 다음 값을 바로 돌려준다(토스트 문구 등). 서버 반영은 나중에 된다.
  const toggle = useCallback(
    ({ feedId, currentValue }) => {
      const normalizedId = normalizeFeedId(feedId);
      const fallbackValue = Boolean(currentValue);
      const nextValue = !(readCachedValue(normalizedId) ?? fallbackValue);

      const detailQueryKey = feedDetailKeys.detail(userId, normalizedId);
      const isRefetching =
        queryClient.isFetching({ queryKey: userFeedQueryKey }) > 0 ||
        queryClient.isFetching({ queryKey: detailQueryKey }) > 0;

      if (!isRefetching) {
        applyToggle(normalizedId, fallbackValue);
        return nextValue;
      }

      // 진행 중인 조회 결과가 낙관적 업데이트를 덮어쓰지 않도록 먼저 취소한다
      Promise.all([
        queryClient.cancelQueries({ queryKey: userFeedQueryKey }),
        queryClient.cancelQueries({ queryKey: detailQueryKey }),
      ]).finally(() => applyToggle(normalizedId, fallbackValue));

      return nextValue;
    },
    [applyToggle, queryClient, readCachedValue, userFeedQueryKey, userId],
  );

  // 화면을 떠날 때 대기 중인 탭은 기다리지 않고 바로 보낸다
  useEffect(() => {
    const syncStates = syncStatesRef.current;

    return () => {
      syncStates.forEach((state, feedId) => {
        if (!state.timer) return;

        clearTimeout(state.timer);
        sync(feedId);
      });
    };
  }, [sync]);

  return { toggle };
}
