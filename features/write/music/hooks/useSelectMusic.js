import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import axios from 'axios';

import {
  useQuery,
} from '@tanstack/react-query';

import useInfiniteSearchQuery from '../../../../shared/hooks/useInfiniteSearchQuery';

import {
  useRecordFormStore,
} from '../../store/useRecordFormStore';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL;

const MUSIC_PAGE_LIMIT = 20;

const getMusicKey = music => {
  return music.externalId;
};

async function fetchPopularMusics({
  signal,
}) {
  const response = await axios.get(
    `${API_BASE_URL}/music/popular`,
    {
      signal,
    },
  );

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return Array.isArray(response.data?.items)
    ? response.data.items
    : [];
}

async function fetchMusicSearchPage({
  keyword,
  pageParam,
  signal,
}) {
  const response = await axios.get(
    `${API_BASE_URL}/music/search`,
    {
      params: {
        keyword,
        page: pageParam,
        limit: MUSIC_PAGE_LIMIT,
      },
      signal,
    },
  );

  const data = response.data ?? {};

  return {
    items: Array.isArray(data.items)
      ? data.items
      : [],

    hasNextPage:
      Boolean(data.hasNextPage),

    nextPage:
      data.nextPage ?? null,
  };
}

export default function useSelectMusic(
  onClose,
) {
  const [keyword, setKeyword] =
    useState('');

  const [
    selectedMusicId,
    setSelectedMusicId,
  ] = useState(null);

  const setMusic = useRecordFormStore(
    state => state.setMusic,
  );

  const trimmedKeyword = keyword.trim();

  /*
   * 검색어가 없을 때 표시할 인기곡입니다.
   * 인기곡은 무한 스크롤 검색이 아니므로
   * 일반 useQuery를 사용합니다.
   */
  const popularQuery = useQuery({
    queryKey: [
      'music',
      'popular',
    ],

    queryFn:
      fetchPopularMusics,

    staleTime:
      10 * 60 * 1000,
  });

  /*
   * 검색어가 있을 때만 음악 검색 API를
   * 호출합니다.
   */
  const searchQuery =
    useInfiniteSearchQuery({
      queryKey: [
        'music',
        'search',
      ],

      keyword,

      fetchPage:
        fetchMusicSearchPage,

      enabled:
        Boolean(trimmedKeyword),

      minimumKeywordLength: 1,

      debounceMs: 400,

      getItemKey:
        getMusicKey,

      keepPreviousResults: true,
    });

  const musicList = useMemo(() => {
    if (trimmedKeyword) {
      return searchQuery.items;
    }

    return popularQuery.data ?? [];
  }, [
    trimmedKeyword,
    searchQuery.items,
    popularQuery.data,
  ]);

  const loading = trimmedKeyword
    ? searchQuery.loading
    : popularQuery.isPending;

  const handleChangeKeyword =
    useCallback(text => {
      setKeyword(text);
      setSelectedMusicId(null);
    }, []);

  const handleFocusSearch =
    useCallback(() => {
      setSelectedMusicId(null);
    }, []);

  /*
   * 기존 화면과 동일하게 externalId를
   * 전달받는 방식입니다.
   */
  const handleSelectMusic =
    useCallback(
      musicId => {
        const selectedMusic =
          musicList.find(music => {
            return (
              String(music.externalId) ===
              String(musicId)
            );
          });

        if (!selectedMusic) {
          return;
        }

        setSelectedMusicId(
          selectedMusic.externalId,
        );

        setMusic(selectedMusic);

        onClose?.();
      },
      [
        musicList,
        onClose,
        setMusic,
      ],
    );

  return {
    keyword,
    musicList,

    loading,

    loadingMore:
      trimmedKeyword
        ? searchQuery.loadingMore
        : false,

    hasNextPage:
      trimmedKeyword
        ? searchQuery.hasNextPage
        : false,

    selectedMusicId,

    error: trimmedKeyword
      ? searchQuery.error
      : popularQuery.error,

    handleChangeKeyword,
    handleFocusSearch,
    handleSelectMusic,

    handleLoadMore:
      searchQuery.handleLoadMore,
  };
}