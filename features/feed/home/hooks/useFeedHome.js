import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

function normalizeFeedItem(item) {
  if (!item?.feedId) {
    return null;
  }

  return {
    ...item,
    user: item.user ?? {},
    record: item.record ?? {},
    music: item.music ?? null,
    files: Array.isArray(item.files) ? item.files : [],
    isLiked: item.isLiked ?? false,
    isBookmarked: item.isBookmarked ?? false,
    likeCount: item.likeCount ?? 0,
    bookmarkCount: item.bookmarkCount ?? 0,
  };
}

export default function useFeedHome({ userId }) {
  const [activeTab, setActiveTab] = useState('추천');
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    data: posts = [],
    refetch: refetchFeed,
  } = useQuery({
    queryKey: ['feeds', userId],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/feed`, {
        params: {
          userId,
          limit: 20,
        },
      });

      const data = response.data;
      const items = Array.isArray(data)
        ? data
        : data?.items;

      if (!Array.isArray(items)) {
        return [];
      }

      return items
        .map(normalizeFeedItem)
        .filter(Boolean);
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const onTabPress = useCallback(tab => {
    setActiveTab(tab);
  }, []);

  return {
    activeTab,
    posts,
    currentIndex,
    setCurrentIndex,
    refetchFeed,
    onTabPress,
  };
}