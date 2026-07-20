import {
  useCallback,
  useState,
} from 'react';

import axios from 'axios';

import useInfiniteSearchQuery from '../../../../shared/hooks/useInfiniteSearchQuery';

import {
  useLetterFormStore,
} from '../../store/useLetterFormStore';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL;

const USER_PAGE_LIMIT = 20;

const getUserKey = user => {
  return user.id;
};

async function fetchUserSearchPage({
  keyword,
  pageParam,
  signal,
  currentUserId,
}) {
  const response = await axios.get(
    `${API_BASE_URL}/user/search`,
    {
      params: {
        keyword,
        currentUserId,
        page: pageParam,
        limit: USER_PAGE_LIMIT,
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

export default function useSelectRecipient(
  onClose,
  currentUserId,
) {
  const [keyword, setKeyword] =
    useState('');

  const [
    selectedRecipientId,
    setSelectedRecipientId,
  ] = useState(null);

  /*
   * receiver는 편지를 보낼 때만 필요한 값이므로
   * useLetterFormStore에 저장합니다.
   */
  const setReceiver = useLetterFormStore(
    state => state.setReceiver,
  );

  const fetchPage = useCallback(
    ({
      keyword: searchKeyword,
      pageParam,
      signal,
    }) => {
      return fetchUserSearchPage({
        keyword: searchKeyword,
        pageParam,
        signal,
        currentUserId,
      });
    },
    [currentUserId],
  );

  const userQuery =
    useInfiniteSearchQuery({
      queryKey: [
        'users',
        'search',
        currentUserId,
      ],

      keyword,

      fetchPage,

      enabled:
        Boolean(currentUserId),

      /*
       * 검색어가 없어도 본인과 추천 사용자 목록을
       * 불러오기 때문에 0으로 설정합니다.
       */
      minimumKeywordLength: 0,

      debounceMs: 400,
      emptyKeywordDebounceMs: 0,

      getItemKey:
        getUserKey,

      keepPreviousResults: true,
    });

  const handleChangeKeyword =
    useCallback(text => {
      setKeyword(text);

      setSelectedRecipientId(null);
    }, []);

  const handleFocusSearch =
    useCallback(() => {
      setSelectedRecipientId(null);
    }, []);

  const handleSelectRecipient =
    useCallback(
      recipient => {
        if (
          recipient?.id === null ||
          recipient?.id === undefined
        ) {
          return;
        }

        setSelectedRecipientId(
          recipient.id,
        );

        setReceiver(recipient);

        onClose?.();
      },
      [
        onClose,
        setReceiver,
      ],
    );

  return {
    keyword,

    userList:
      userQuery.items,

    loading:
      userQuery.loading,

    loadingMore:
      userQuery.loadingMore,

    hasNextPage:
      userQuery.hasNextPage,

    selectedRecipientId,

    error:
      userQuery.error,

    handleChangeKeyword,
    handleFocusSearch,
    handleSelectRecipient,

    handleLoadMore:
      userQuery.handleLoadMore,
  };
}