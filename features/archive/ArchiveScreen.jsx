import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import TopNavigation, { ARCHIVE_TOP_NAVIGATION_TABS } from '../../shared/components/navigation/topnavigation/TopNavigation';
import TabBar from '../../shared/components/navigation/tabbar/TabBar';
import useCurrentUser from '../../shared/hooks/useCurrentUser';
import { colors } from '../../shared/styles/color';

import BookmarkSection from './bookmark/BookmarkSection';
import MyFeedSection from './myfeed/home/MyFeedSection';
import { prefetchAllMyFeeds } from './myfeed/all/hooks/useAllMyFeeds';
import { prefetchGenreFeeds } from './myfeed/genre/detail/hooks/useGenreFeeds';

export const ARCHIVE_TAB = {
  MYFEED: 'myfeed',
  BOOKMARK: 'bookmark',
};

const ARCHIVE_TABS = [
  { key: ARCHIVE_TAB.MYFEED, label: '내 기록' },
  { key: ARCHIVE_TAB.BOOKMARK, label: '북마크' },
];

/* TabBar 는 인덱스 기반이라 key 와 매핑한다 */
const ARCHIVE_TAB_LABELS = ARCHIVE_TABS.map(tab => tab.label);

// route.params.tab 으로 열 탭을 지정할 수 있다 (예: 북마크 토스트의 '이동' → ARCHIVE_TAB.BOOKMARK)
const ArchiveScreen = ({ navigation, route }) => {
  const { currentUser, userId } = useCurrentUser();
  const queryClient = useQueryClient();

  const routeTab = route?.params?.tab;

  // 처음 열 때부터 param 의 탭으로 그려야 다른 탭의 조회가 먼저 나가지 않는다
  const [activeTab, setActiveTab] = useState(
    () => (ARCHIVE_TABS.some(tab => tab.key === routeTab) ? routeTab : ARCHIVE_TAB.MYFEED),
  );
  const activeTabIndex = ARCHIVE_TABS.findIndex(tab => tab.key === activeTab);

  // 탭 화면은 이미 떠 있을 수 있어 param 이 바뀔 때마다 반영하고,
  // 같은 param 으로 다시 들어와도 반영되도록 적용 후 비운다

  useEffect(() => {
    if (!routeTab) return;

    if (ARCHIVE_TABS.some(tab => tab.key === routeTab)) {
      setActiveTab(routeTab);
    }
    navigation.setParams({ tab: undefined });
  }, [navigation, routeTab]);

  const handleChangeTab = useCallback(index => {
    setActiveTab(ARCHIVE_TABS[index].key);
  }, []);

  const handlePressWriteFeed = useCallback(() => {
    navigation.navigate('Record', { type: 'feed' });
  }, [navigation]);

  const handlePressGenreMore = useCallback(() => {
    navigation.navigate('MyFeedGenre');
  }, [navigation]);

  const handlePressGenre = useCallback(genre => {
    prefetchGenreFeeds(queryClient, { userId, genre });
    navigation.navigate('MyFeedGenreDetail', { genre });
  }, [navigation, queryClient, userId]);

  // month 없으면 전체. anchorCursor: 그 달부터 시작할 커서 (가장 최근 달이면 null → 처음부터)
  const handlePressAllFeed = useCallback((month, anchorCursor = null) => {
    prefetchAllMyFeeds(queryClient, {
      userId,
      anchorMonth: Number.isInteger(anchorCursor) ? month : null,
      anchorCursor,
    });
    navigation.navigate('MyFeedAll', month ? { month, anchorCursor } : undefined);
  }, [navigation, queryClient, userId]);

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
        <MyFeedSection
          navigation={navigation}
          userId={userId}
          onPressWriteFeed={handlePressWriteFeed}
          onPressGenreMore={handlePressGenreMore}
          onPressGenre={handlePressGenre}
          onPressAllFeed={handlePressAllFeed}
        />
      )}

      {activeTab === ARCHIVE_TAB.BOOKMARK && (
        <BookmarkSection navigation={navigation} userId={userId} />
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
