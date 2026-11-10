// 피드 상세에 머문 시간 (FEED_DETAIL_VIEW).
// 화면이 보일 때(focus)부터 떠날 때(blur · 닫힘)까지 재고, 앱이 백그라운드에 있던 시간은 뺀다.
// 백그라운드로 갈 때는 그때까지 잰 시간을 바로 보낸다 (그대로 앱이 종료돼도 남도록).
// 그래서 한 번 본 상세가 여러 줄로 나뉘어 쌓일 수 있다. 분석할 때는 같은 회원 · 글의 가까운 기록을 더해서 본다.

import { useCallback } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { USER_EVENT_TYPE, flushEvents, logEvent } from './eventQueue';
import { hasId } from '../utils/id';

export default function useFeedDetailDwell(feedId) {
  useFocusEffect(
    useCallback(() => {
      if (!hasId(feedId)) return undefined;

      let startedAt = AppState.currentState === 'active' ? Date.now() : null;
      let accumulated = 0;

      const pause = () => {
        if (startedAt == null) return;
        accumulated += Date.now() - startedAt;
        startedAt = null;
      };

      const report = () => {
        logEvent({ type: USER_EVENT_TYPE.FEED_DETAIL_VIEW, feedId, durationMs: accumulated });
        accumulated = 0;
      };

      const subscription = AppState.addEventListener('change', nextState => {
        if (nextState === 'active') {
          startedAt ??= Date.now();
          return;
        }

        pause();
        report();
        void flushEvents();
      });

      return () => {
        subscription.remove();
        pause();
        report();
      };
    }, [feedId])
  );
}
