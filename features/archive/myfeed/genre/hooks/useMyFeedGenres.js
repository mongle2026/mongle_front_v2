import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient, { isApiConfigured } from '../../../../../shared/api/client';
import { resolveMediaUri, toImageSource } from '../../../../../shared/utils/media';

import { archiveKeys } from '../../../api/archiveKeys';
import { SESSION_COVER_SEED } from '../../utils/sessionCover';
import { hasId } from '../../../../../shared/utils/id';

// 장르별 기록. GET /feed/me/genres?userId=&limit=&coverSeed=
// 한 곡이 가진 모든 장르에 글이 들어간다. 커버는 서버가 그 장르 곡들 커버 중 하나를 골라 준다(앱 실행 동안 고정).
const useMyFeedGenres = ({ userId, limit }) => {
  const isConfigured = Boolean(isApiConfigured && hasId(userId));

  const { data } = useQuery({
    queryKey: archiveKeys.myFeedGenres(userId, limit),
    enabled: isConfigured,
    queryFn: async () => {
      const response = await apiClient.get('/feed/me/genres', {
        params: { userId, limit, coverSeed: SESSION_COVER_SEED },
      });
      return Array.isArray(response.data?.items) ? response.data.items : [];
    },
  });

  const genres = useMemo(
    () => (data ?? []).map(item => {
      const coverUri = resolveMediaUri(item.artwork);

      return {
        genre: item.genre,
        feedCount: item.feedCount,
        imageSource: toImageSource(coverUri),
      };
    }),
    [data],
  );

  return {
    genres,
  };
};

export default useMyFeedGenres;
