import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../../../shared/api/client';
import { resolveMediaUri } from '../../../../../shared/utils/media';

import { archiveKeys } from '../../../api/archiveKeys';
import { pickSessionCover } from '../../utils/sessionCover';

// 장르별 기록. GET /feed/me/genres?userId=&limit=
// 한 곡이 가진 모든 장르에 글이 들어간다. 커버는 그 장르 곡들 커버 중 랜덤 하나(앱 실행 동안 고정).
const useMyFeedGenres = ({ userId, limit }) => {
  const isConfigured = Boolean(isApiConfigured && Number(userId) > 0);

  const { data, isPending } = useQuery({
    queryKey: archiveKeys.myFeedGenres(userId, limit),
    enabled: isConfigured,
    queryFn: async () => {
      const response = await apiClient.get('/feed/me/genres', { params: { userId, limit } });
      return Array.isArray(response.data?.items) ? response.data.items : [];
    },
  });

  const genres = useMemo(
    () => (data ?? []).map(item => {
      const coverUri = resolveMediaUri(pickSessionCover(`genre:${item.genre}`, item.artworks));

      return {
        genre: item.genre,
        feedCount: item.feedCount,
        imageSource: coverUri ? { uri: coverUri } : undefined,
      };
    }),
    [data],
  );

  return {
    genres,
    isGenresLoading: isConfigured && isPending,
  };
};

export default useMyFeedGenres;
