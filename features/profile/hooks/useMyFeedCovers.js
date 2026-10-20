import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../shared/api/client';
import { flattenPages, getNextCursor, toCursorPage, withCursor } from '../../../shared/api/cursorPage';
import { resolveMediaUri, toImageSource } from '../../../shared/utils/media';
import { hasId } from '../../../shared/utils/id';

import { archiveKeys } from '../../archive/api/archiveKeys';

const MY_FEED_COVER_LIMIT = 20;

// 피드 응답 → 프로필 그리드 카드 (노래 커버 + 제목)
const toFeedCover = feed => ({
  feedId: feed.feedId,
  imageSource: toImageSource(resolveMediaUri(feed?.music?.musicArtwork)),
  title: feed?.music?.musicTitle ?? '',
});

// 프로필에 보여줄 내가 쓴 피드의 노래 커버 (최신순). GET /feed/me?cursor=&limit=
// 키를 보관함 내 기록 아래에 두어서 피드 작성/수정/삭제 후 archiveKeys.all invalidate 로 같이 갱신된다
const useMyFeedCovers = ({ userId }) => {
  const isConfigured = Boolean(isApiConfigured && hasId(userId));

  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [...archiveKeys.myFeed(userId), 'profile'],
    enabled: isConfigured,
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.get('/feed/me', {
        params: withCursor({ limit: MY_FEED_COVER_LIMIT }, pageParam),
      });
      return toCursorPage(response.data, toFeedCover);
    },
    getNextPageParam: getNextCursor,
  });

  const covers = useMemo(() => flattenPages(data?.pages), [data?.pages]);

  return {
    covers,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  };
};

export default useMyFeedCovers;
