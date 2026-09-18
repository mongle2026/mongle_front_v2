import { useCallback, useState } from 'react';

// 당겨서 새로고침. refetch 가 끝날 때까지 로딩 원을 띄운다 (피드 useFeedHomeRefresh 와 같은 방식)
// refetch: react-query 의 refetch
const usePullRefresh = ({ refetch, errorMessage = '새로고침에 실패했습니다.' } = {}) => {
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (isPullRefreshing || !refetch) return;

    setIsPullRefreshing(true);

    try {
      await refetch({ throwOnError: true });
    } catch (error) {
      console.warn(errorMessage, error);
    } finally {
      setIsPullRefreshing(false);
    }
  }, [errorMessage, isPullRefreshing, refetch]);

  return {
    isPullRefreshing,
    handleRefresh,
  };
};

export default usePullRefresh;
