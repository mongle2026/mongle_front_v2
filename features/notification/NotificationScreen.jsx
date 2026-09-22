import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import IcArrowLeft from '../../assets/icons/ic_arrow_left.svg';

import TopIconNavigation from '../../shared/components/navigation/topnavigation/TopIconNavigation';
import Tabs, { TABS_BOTTOM_FADE_HEIGHT } from '../../shared/components/navigation/tabs/Tabs';

import { colors } from '../../shared/styles/color';
import { gap, padding } from '../../shared/styles/token';

import InfoBanner from './components/InfoBanner';
import NotificationListItem, {
  NOTIFICATION_TYPE,
} from './components/NotificationListItem';
import useNotifications from './hooks/useNotifications';
import { getNotificationRoute } from './utils/getNotificationRoute';
import useCurrentUser from '../../shared/hooks/useCurrentUser';

// type이 null이면 전체
const NOTIFICATION_FILTERS = [
  { type: null, label: '전체' },
  { type: NOTIFICATION_TYPE.FEED, label: '피드' },
  { type: NOTIFICATION_TYPE.LETTER, label: '편지' },
  { type: NOTIFICATION_TYPE.NEWS, label: '소식' },
];

/* Tabs 는 인덱스 기반이라 type 과 매핑한다 */
const NOTIFICATION_FILTER_LABELS = NOTIFICATION_FILTERS.map(filter => filter.label);

const notificationKeyExtractor = notification =>
  String(notification.notificationId);

const renderNotificationSeparator = () => (
  <View style={styles.notificationSeparator} />
);

const NotificationScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeFilterIndex, setActiveFilterIndex] = useState(0);
  const { userId } = useCurrentUser();

  // 페이지 단위로 받아서 탭마다 서버에서 걸러 받는다
  const { type } = NOTIFICATION_FILTERS[activeFilterIndex];
  const {
    notifications,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useNotifications({ userId, type });

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderNotification = useCallback(
    ({ item }) => {
      const route = getNotificationRoute(item);

      return (
        <NotificationListItem
          {...item}
          onPress={route ? () => navigation.navigate(route.name, route.params) : undefined}
        />
      );
    },
    [navigation]
  );

  const listContentStyle = useMemo(
    () => [
      styles.notificationContainer,
      {
        paddingTop: TABS_BOTTOM_FADE_HEIGHT + gap.S,
        paddingBottom: insets.bottom + gap.S,
      },
    ],
    [insets.bottom]
  );

  const handlePressBack = useCallback(() => navigation?.goBack(), [navigation]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopIconNavigation
        type="text"
        leftIcon={IcArrowLeft}
        leftAccessibilityLabel="뒤로가기"
        headerText="알림"
        showNext={false}
        onPressClose={handlePressBack}
      />

      <InfoBanner />

      <Tabs
        tabs={NOTIFICATION_FILTER_LABELS}
        activeIndex={activeFilterIndex}
        onChange={setActiveFilterIndex}
        backgroundColor={colors.bgLayerDefault}
      />

      {/* 목록을 Tabs 하단 그라데이션 밑으로 올려 스크롤 시 흐려지며 사라지게 한다 */}
      <View style={styles.listContainer}>
        <FlatList
          data={notifications}
          keyExtractor={notificationKeyExtractor}
          renderItem={renderNotification}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ItemSeparatorComponent={renderNotificationSeparator}
          contentContainerStyle={listContentStyle}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgLayerDefault,
  },
  listContainer: {
    flex: 1,
    marginTop: -TABS_BOTTOM_FADE_HEIGHT,
  },
  // 아이템이 width 100% 라서 셀이 가로로 꽉 차야 한다 (alignItems 기본값 stretch 유지)
  notificationContainer: {
    paddingHorizontal: padding.XS,
  },
  notificationSeparator: {
    height: gap.S,
  },
});

export default memo(NotificationScreen);
