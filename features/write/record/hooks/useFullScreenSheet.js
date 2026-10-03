import { useCallback } from 'react';

import { useGlobalOverlay } from '../../../../shared/providers/GlobalOverlayProvider';
import { dismissKeyboardThen } from '../../../../shared/utils/keyboardUtils';

// 화면 전체를 덮는 BottomSheet 의 Overlay contentContainerStyle
const FULL_SCREEN_CONTAINER_STYLE = Object.freeze({
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
});

/*
 * 기록 작성/수정 화면의 선택 BottomSheet(음악·수신인·날짜)를 여는 함수입니다.
 * 키보드가 다 내려간 뒤에 열어서, 시트가 올라오는 동안 화면이 출렁이지 않게 합니다.
 */
export const useFullScreenSheet = () => {
  const { openOverlay } = useGlobalOverlay();

  return useCallback(({ id, accessibilityLabel, renderContent }) => {
    dismissKeyboardThen(() => {
      openOverlay({
        id,
        accessibilityLabel,
        contentContainerStyle: FULL_SCREEN_CONTAINER_STYLE,
        renderContent,
      });
    });
  }, [openOverlay]);
};
