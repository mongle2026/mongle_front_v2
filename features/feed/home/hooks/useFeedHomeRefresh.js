import { useCallback, useState } from 'react';

const useFeedHomeRefresh = ({ refetchFeed, resetPlayback }) => {
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (isPullRefreshing) return;

    resetPlayback();
    setIsPullRefreshing(true);

    try {
      await refetchFeed({ throwOnError: true });
    } catch (error) {
      console.warn('피드 새로고침에 실패했습니다.', error);
    } finally {
      setIsPullRefreshing(false);
    }
  }, [isPullRefreshing, refetchFeed, resetPlayback]);

  return {
    isPullRefreshing,
    handleRefresh,
  };
};

export default useFeedHomeRefresh;