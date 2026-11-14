import apiClient from '../../../shared/api/client';

import { normalizeFeedItem } from './normalizeFeed';

// 피드 하나. GET /feed/{feedId}
// 홈 캐시(placeholder)와 같은 형태로 맞춘다
export async function fetchFeedDetail(feedId) {
  const response = await apiClient.get(`/feed/${feedId}`);

  return normalizeFeedItem(response.data);
}
