import { useCallback } from 'react';

import MusicSelectBottomSheet from '../../music/components/MusicSelectBottomSheet';
import { useFullScreenSheet } from './useFullScreenSheet';

/*
 * RecordScreen / RecordEditScreen에서 공통으로 사용하는
 * 음악 선택 BottomSheet 열기 로직입니다.
 */
export const useMusicSelectOverlay = overlayId => {
  const openFullScreenSheet = useFullScreenSheet();

  const handleOpenMusicSelect = useCallback(() => {
    openFullScreenSheet({
      id: overlayId,
      accessibilityLabel: '음악 선택 닫기',
      renderContent: ({ close }) => <MusicSelectBottomSheet onClose={close} />,
    });
  }, [openFullScreenSheet, overlayId]);

  return handleOpenMusicSelect;
};
