import { useCallback } from 'react';
import { Keyboard } from 'react-native';

import { useGlobalOverlay } from '../../../../shared/providers/GlobalOverlayProvider';
import MusicSelectBottomSheet from '../../music/components/MusicSelectBottomSheet';
import { fullScreenOverlayContainerStyle } from '../../utils/overlayContainerStyle';

/*
 * RecordScreen / RecordEditScreen에서 공통으로 사용하는
 * 음악 선택 BottomSheet 열기 로직입니다.
 */
export const useMusicSelectOverlay = overlayId => {
  const { openOverlay } = useGlobalOverlay();

  const handleOpenMusicSelect = useCallback(() => {
    Keyboard.dismiss();

    openOverlay({
      id: overlayId,
      accessibilityLabel: '음악 선택 닫기',
      contentContainerStyle: fullScreenOverlayContainerStyle,
      renderContent: ({ close }) => <MusicSelectBottomSheet onClose={close} />,
    });
  }, [openOverlay, overlayId]);

  return handleOpenMusicSelect;
};
