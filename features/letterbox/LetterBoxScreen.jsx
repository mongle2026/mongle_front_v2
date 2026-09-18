import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import WriteFab, { DEFAULT_WRITE_FAB_HEIGHT } from '../../shared/components/action/WriteFab';
import TopNavigation, { LETTER_TOP_NAVIGATION_TABS } from '../../shared/components/navigation/topnavigation/TopNavigation';
import TabBar from '../../shared/components/navigation/tabbar/TabBar';
import useCurrentUser from '../../shared/hooks/useCurrentUser';
import { colors } from '../../shared/styles/color';

import LetterSection from './letter/home/LetterSection';
import StampSection from './stamp/home/StampSection';
import { prefetchStampDetail } from './stamp/detail/hooks/useStampDetail';

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

const LetterBoxScreen = ({ navigation }) => {
  const { userId } = useCurrentUser();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(LETTER_BOX_TAB.LETTER);
  const activeTabIndex = LETTER_BOX_TABS.findIndex(tab => tab.key === activeTab);

  const handleChangeTab = useCallback(index => {
    setActiveTab(LETTER_BOX_TABS[index].key);
  }, []);

  const [fabHeight, setFabHeight] = useState(DEFAULT_WRITE_FAB_HEIGHT);

  const handlePressBell = useCallback(() => {
    // navigation.navigate('Notification');
  }, []);

  const handlePressLetter = useCallback(letter => {
    navigation.navigate('LetterDetail', { letterId: letter.letterId });
  }, [navigation]);

  const handlePressStamp = useCallback(stampCode => {
    prefetchStampDetail(queryClient, { stampCode, userId });
    navigation.navigate('StampDetail', { stampCode });
  }, [navigation, queryClient, userId]);

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
        {activeTab === LETTER_BOX_TAB.LETTER && (
          <LetterSection userId={userId} bottomInset={fabHeight} onPressLetter={handlePressLetter} />
        )}
        {activeTab === LETTER_BOX_TAB.STAMP && (
          <StampSection userId={userId} bottomInset={fabHeight} onPressStamp={handlePressStamp} />
        )}
      </View>

      <WriteFab navigation={navigation} expandedLabel="편지함 더 둘러보기" onHeightChange={setFabHeight} />
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
});

export default LetterBoxScreen;
