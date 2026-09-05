import { useCallback, useState } from 'react';

/*
 * RecordScreen / RecordEditScreen에서 공통으로 사용하는
 * 하단 바 높이 측정 및 actions / font 모드 전환 상태입니다.
 */
export const useBottomBarPanel = () => {
  const [bottomBarHeight, setBottomBarHeight] = useState(0);
  const [bottomBarMode, setBottomBarMode] = useState('actions');

  const handleBottomBarLayout = useCallback(event => {
    setBottomBarHeight(event.nativeEvent.layout.height);
  }, []);

  const handleShowFontMode = useCallback(() => {
    setBottomBarMode('font');
  }, []);

  const handleShowActionsMode = useCallback(() => {
    setBottomBarMode('actions');
  }, []);

  return {
    bottomBarHeight,
    bottomBarMode,
    handleBottomBarLayout,
    handleShowFontMode,
    handleShowActionsMode,
  };
};
