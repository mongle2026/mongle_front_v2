import { useCallback, useEffect } from 'react';

import FAB from '../../../../shared/components/action/FAB';
import { useGlobalOverlay } from '../../../../shared/providers/GlobalOverlayProvider';
import { useBottomNavigationHeight } from '../../../../shared/components/navigation/bottomnavigation/BottomNavigation';
import { padding } from '../../../../shared/styles/token';

const FAB_OVERLAY_ID = 'feed-home-fab';
export const FAB_BOTTOM_GAP = 10;

const useFeedHomeFab = navigation => {
  const bottomNavigationHeight = useBottomNavigationHeight();
  const { activeOverlayId, openOverlay, closeOverlay } = useGlobalOverlay();
  const isFabOpen = activeOverlayId === FAB_OVERLAY_ID;

  const handlePressFeedWrite = useCallback(() => {
    navigation.navigate('FeedWrite');
  }, [navigation]);

  const handlePressLetterWrite = useCallback(() => {
    navigation.navigate('LetterWrite');
  }, [navigation]);

  const handleOpenFab = useCallback(() => {
    openOverlay({
      id: FAB_OVERLAY_ID,
      accessibilityLabel: '작성 메뉴 닫기',
      closeOnDimPress: true,
      closeOnBackPress: true,
      contentContainerStyle: {
        right: padding.XL,
        bottom: bottomNavigationHeight + FAB_BOTTOM_GAP,
      },
      renderContent: ({ close }) => (
        <FAB
          open
          closeOnActionPress={false}
          onOpenChange={nextOpen => {
            if (!nextOpen) {
              close();
            }
          }}
          onFeedPress={() => {
            close();
            handlePressFeedWrite();
          }}
          onLetterPress={() => {
            close();
            handlePressLetterWrite();
          }}
        />
      ),
    });
  }, [
    bottomNavigationHeight,
    handlePressFeedWrite,
    handlePressLetterWrite,
    openOverlay,
  ]);

  const handleFabOpenChange = useCallback(
    nextOpen => {
      if (nextOpen) {
        handleOpenFab();
        return;
      }

      closeOverlay(FAB_OVERLAY_ID);
    },
    [closeOverlay, handleOpenFab],
  );

  useEffect(() => {
    return () => {
      closeOverlay(FAB_OVERLAY_ID);
    };
  }, [closeOverlay]);

  return {
    isFabOpen,
    handleFabOpenChange,
  };
};

export default useFeedHomeFab;