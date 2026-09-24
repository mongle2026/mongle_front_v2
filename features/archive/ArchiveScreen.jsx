import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TopNavigation, { ARCHIVE_TOP_NAVIGATION_TABS } from '../../shared/components/navigation/topnavigation/TopNavigation';
import TabBar from '../../shared/components/navigation/tabbar/TabBar';
import useCurrentUser from '../../shared/hooks/useCurrentUser';
import { colors } from '../../shared/styles/color';

import MyFeedSection from './myfeed/home/MyFeedSection';

const ARCHIVE_TAB = {
  MYFEED: 'myfeed',
  BOOKMARK: 'bookmark',
};

const ARCHIVE_TABS = [
  { key: ARCHIVE_TAB.MYFEED, label: '내 기록' },
  { key: ARCHIVE_TAB.BOOKMARK, label: '북마크' },
];

/* TabBar 는 인덱스 기반이라 key 와 매핑한다 */
const ARCHIVE_TAB_LABELS = ARCHIVE_TABS.map(tab => tab.label);

const ArchiveScreen = ({ navigation }) => {
  const { currentUser, userId } = useCurrentUser();

  const [activeTab, setActiveTab] = useState(ARCHIVE_TAB.MYFEED);
  const activeTabIndex = ARCHIVE_TABS.findIndex(tab => tab.key === activeTab);

  const handleChangeTab = useCallback(index => {
    setActiveTab(ARCHIVE_TABS[index].key);
  }, []);

  const handlePressWriteFeed = useCallback(() => {
    navigation.navigate('Record', { type: 'feed' });
  }, [navigation]);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.topSafeArea}>
        <TopNavigation
          tabs={ARCHIVE_TOP_NAVIGATION_TABS}
          showProfile
          profileImageUri={currentUser?.profileImageUri}
        />
      </SafeAreaView>

      <TabBar
        tabs={ARCHIVE_TAB_LABELS}
        activeIndex={activeTabIndex}
        onChange={handleChangeTab}
      />

      {activeTab === ARCHIVE_TAB.MYFEED && (
        <MyFeedSection userId={userId} onPressWriteFeed={handlePressWriteFeed} />
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
});

export default ArchiveScreen;
