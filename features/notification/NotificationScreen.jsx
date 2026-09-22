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
import { MOCK_NOTIFICATIONS } from './data/mockNotifications';

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

const renderNotification = ({ item }) => <NotificationListItem {...item} />;

const renderNotificationSeparator = () => (
  <View style={styles.notificationSeparator} />
);

const NotificationScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeFilterIndex, setActiveFilterIndex] = useState(0);

  // TODO: 알림 API 연결
  const notifications = MOCK_NOTIFICATIONS;

  const filteredNotifications = useMemo(() => {
    const { type } = NOTIFICATION_FILTERS[activeFilterIndex];
    if (!type) return notifications;

    return notifications.filter(notification => notification.type === type);
  }, [notifications, activeFilterIndex]);

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
          data={filteredNotifications}
          keyExtractor={notificationKeyExtractor}
          renderItem={renderNotification}
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
