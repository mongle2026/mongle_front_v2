import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../../shared/api/client';
import { flattenPages, getNextCursor, toCursorPage, withCursor } from '../../../../shared/api/cursorPage';
import { hasId } from '../../../../shared/utils/id';

import { profileKeys } from '../../api/profileKeys';
import { toFeedCover } from '../../utils/toFeedCover';

const EDIT_COVER_LIMIT = 20;

// 게시글 편집 목록. 프로필에서 뺀 글까지 내가 쓴 글 전체를 최신순으로 (cover.profileHidden 로 구분).
// GET /feed/me?cursor=&limit=
const useProfileFeedEditCovers = ({ userId }) => {
  const isConfigured = Boolean(isApiConfigured && hasId(userId));

  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: profileKeys.editCovers(userId),
    enabled: isConfigured,
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.get('/feed/me', {
        params: withCursor({ limit: EDIT_COVER_LIMIT }, pageParam),
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

export default useProfileFeedEditCovers;
