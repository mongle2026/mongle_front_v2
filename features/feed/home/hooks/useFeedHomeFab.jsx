import { useCallback, useEffect, useState } from 'react';
import { BackHandler } from 'react-native';

import { gap, padding } from '../../../../shared/styles/token';

// FAB(default) 레이아웃 측정 전 사용할 예상 높이
// (padding.L * 2 + 텍스트 lineHeight + FAB 자체 배경의 상하 padding + 회색 배경 박스의 상하 padding.M)
export const DEFAULT_FAB_HEIGHT = padding.L * 2 + 17 + gap.M * 2 + padding.M * 2;

const useFeedHomeFab = navigation => {
  const [isFabOpen, setIsFabOpen] = useState(false);

  const closeFab = useCallback(() => {
    setIsFabOpen(false);
  }, []);

  const handleFabOpenChange = useCallback(nextOpen => {
    setIsFabOpen(nextOpen);
  }, []);

  const handlePressFeedWrite = useCallback(() => {
    closeFab();
    navigation.navigate('Record', {
      type: 'feed',
    });
  }, [closeFab, navigation]);

  const handlePressLetterWrite = useCallback(() => {
    closeFab();
    navigation.navigate('Record', {
      type: 'letter',
    });
  }, [closeFab, navigation]);

  useEffect(() => {
    if (!isFabOpen) return undefined;

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        closeFab();
        return true;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [closeFab, isFabOpen]);

  return {
    isFabOpen,
    handleFabOpenChange,
    handlePressFeedWrite,
    handlePressLetterWrite,
  };
};

export default useFeedHomeFab;
