import { useCallback, useState } from 'react';

// 당겨서 새로고침. refetch 가 끝날 때까지 로딩 원을 띄운다
// refetch: react-query 의 refetch
// onBeforeRefresh: 새로고침을 시작하기 직전에 할 일 (예: 피드 음악 재생 멈춤)
const usePullRefresh = ({ refetch, onBeforeRefresh, errorMessage = '새로고침에 실패했습니다.' } = {}) => {
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (isPullRefreshing || !refetch) return;

    onBeforeRefresh?.();
    setIsPullRefreshing(true);

    try {
      await refetch({ throwOnError: true });
    } catch (error) {
      console.warn(errorMessage, error);
    } finally {
      setIsPullRefreshing(false);
    }
  }, [errorMessage, isPullRefreshing, onBeforeRefresh, refetch]);

  return {
    isPullRefreshing,
    handleRefresh,
  };
};

export default usePullRefresh;
