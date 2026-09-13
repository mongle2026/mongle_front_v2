import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import FAB from '../../../shared/components/action/FAB';
import TopNavigation, { LETTER_TOP_NAVIGATION_TABS } from '../../../shared/components/navigation/topnavigation/TopNavigation';
import TabBar from '../../../shared/components/navigation/tabbar/TabBar';
import { useBottomNavigationHeight } from '../../../shared/components/navigation/bottomnavigation/BottomNavigation';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import { useGlobalOverlay } from '../../../shared/providers/GlobalOverlayProvider';
import { colors } from '../../../shared/styles/color';
import { padding } from '../../../shared/styles/token';

import useFeedHomeFab, { DEFAULT_FAB_HEIGHT } from '../../feed/home/hooks/useFeedHomeFab';
import LetterSection from './components/LetterSection';
import StampSection from './components/StampSection';

const LETTER_BOX_TAB = {
  LETTER: 'letter',
  STAMP: 'stamp',
};

const LETTER_BOX_TABS = [
  { key: LETTER_BOX_TAB.LETTER, label: '편지' },
  { key: LETTER_BOX_TAB.STAMP, label: '우표' },
];

/* TabBar 는 인덱스 기반이라 key 와 매핑한다 */
const LETTER_BOX_TAB_LABELS = LETTER_BOX_TABS.map(tab => tab.label);

const FAB_OVERLAY_ID = 'letter-fab-overlay';

// 회색 배경의 아래쪽 절반은 solid, 위쪽 절반은 투명 → solid 그라데이션 (locations로 한 레이어에서 처리)
const FAB_BACKGROUND_GRADIENT_COLORS = ['rgba(241, 242, 244, 0)', colors.bgLayerBasement, colors.bgLayerBasement];
const FAB_BACKGROUND_GRADIENT_LOCATIONS = [0, 0.5, 1];

const LetterBoxScreen = ({ navigation }) => {
  const { userId } = useCurrentUser();

  const [activeTab, setActiveTab] = useState(LETTER_BOX_TAB.LETTER);
  const activeTabIndex = LETTER_BOX_TABS.findIndex(tab => tab.key === activeTab);

  const handleChangeTab = useCallback(index => {
    setActiveTab(LETTER_BOX_TABS[index].key);
  }, []);

  const {
    isFabOpen,
    handleFabOpenChange,
    handlePressFeedWrite,
    handlePressLetterWrite,
  } = useFeedHomeFab(navigation);

  const bottomNavigationHeight = useBottomNavigationHeight();
  const { openOverlay, closeOverlay } = useGlobalOverlay();

  const [fabHeight, setFabHeight] = useState(DEFAULT_FAB_HEIGHT);

  const handleFabLayout = useCallback(event => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    setFabHeight(currentHeight => (currentHeight === nextHeight ? currentHeight : nextHeight));
  }, []);

  // FAB 오버레이 처리는 FeedHomeScreen과 동일 (열림 상태 변경과 openOverlay를 같은 이벤트 핸들러에서 호출)
  const renderFabOverlayContent = useCallback(() => (
    <View style={[styles.fabBackground, { marginBottom: bottomNavigationHeight }]}>
      <FAB
        open
        closeOnActionPress={false}
        onOpenChange={nextOpen => {
          if (nextOpen) return;
          closeOverlay(FAB_OVERLAY_ID);
          handleFabOpenChange(false);
        }}
        onFeedPress={() => {
          closeOverlay(FAB_OVERLAY_ID);
          handlePressFeedWrite();
        }}
        onLetterPress={() => {
          closeOverlay(FAB_OVERLAY_ID);
          handlePressLetterWrite();
        }}
      />
    </View>
  ), [bottomNavigationHeight, closeOverlay, handleFabOpenChange, handlePressFeedWrite, handlePressLetterWrite]);

  const handleOpenFab = useCallback(() => {
    handleFabOpenChange(true);

    openOverlay({
      id: FAB_OVERLAY_ID,
      accessibilityLabel: '작성 메뉴 닫기',
      closeOnDimPress: true,
      closeOnBackPress: true,
      contentContainerStyle: styles.fabOverlayContent,
      onClose: () => handleFabOpenChange(false),
      renderContent: renderFabOverlayContent,
    });
  }, [handleFabOpenChange, openOverlay, renderFabOverlayContent]);

  const handlePressBell = useCallback(() => {
    // navigation.navigate('Notification');
  }, []);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.topSafeArea}>
        <TopNavigation
          tabs={LETTER_TOP_NAVIGATION_TABS}
          onPressBell={handlePressBell}
        />
      </SafeAreaView>

      <TabBar
        tabs={LETTER_BOX_TAB_LABELS}
        activeIndex={activeTabIndex}
        onChange={handleChangeTab}
      />

      <View style={styles.content}>
        {activeTab === LETTER_BOX_TAB.LETTER && <LetterSection userId={userId} bottomInset={fabHeight} />}
        {activeTab === LETTER_BOX_TAB.STAMP && <StampSection bottomInset={fabHeight} />}
      </View>

      {!isFabOpen && (
        <LinearGradient
          colors={FAB_BACKGROUND_GRADIENT_COLORS}
          locations={FAB_BACKGROUND_GRADIENT_LOCATIONS}
          style={styles.fabBackground}
          onLayout={handleFabLayout}
        >
          <FAB open={false} onOpenChange={handleOpenFab} />
        </LinearGradient>
      )}

      {isFabOpen && (
        <LinearGradient
          colors={FAB_BACKGROUND_GRADIENT_COLORS}
          locations={FAB_BACKGROUND_GRADIENT_LOCATIONS}
          style={[styles.fabBackground, { height: fabHeight }]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.bgLayerBasement,
  },
  topSafeArea: {
    width: '100%',
    zIndex: 10,
    backgroundColor: colors.bgLayerBasement,
  },
  content: {
    flex: 1,
    width: '100%',
  },
  fabBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: padding.M,
    zIndex: 20,
    elevation: 20,
  },
  fabOverlayContent: {
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
});

export default LetterBoxScreen;
