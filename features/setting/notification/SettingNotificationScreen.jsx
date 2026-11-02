import { useCallback } from 'react';
import { Linking, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';

import IcArrowLeft from '../../../assets/icons/ic_arrow_left.svg';
import IcArrowUpRight from '../../../assets/icons/ic_arrow_up_right.svg';

import TopSubNavigation from '../../../shared/components/navigation/topnavigation/TopSubNavigation';

import { colors } from '../../../shared/styles/color';

import ListRow from '../components/ListRow';
import useNotificationPermission from '../hooks/useNotificationPermission';
import useNotificationSettings, { NOTIFICATION_SETTING_KEY } from '../hooks/useNotificationSettings';

const HEADER_TEXT = '알림 설정';

// 전체 알림 토글 아래에 나열되는 개별 알림 항목. key 는 백엔드 알림 설정 key
const NOTIFICATION_ITEMS = [
  { key: NOTIFICATION_SETTING_KEY.FOLLOW, text: '팔로우 알림', caption: '누군가 나를 팔로우하면 알려드려요.' },
  { key: NOTIFICATION_SETTING_KEY.COMMENT, text: '댓글 알림', caption: '내 글의 댓글과 내 댓글의 답글을 알려드려요.' },
  { key: NOTIFICATION_SETTING_KEY.LETTER_SENT, text: '편지 전송 전 알림', caption: '내가 쓴 편지가 전송되기 하루 전에 알려드려요.' },
  { key: NOTIFICATION_SETTING_KEY.LETTER_RECEIVED, text: '편지 도착 알림', caption: '새로운 편지가 도착하면 알려드려요.' },
  { key: NOTIFICATION_SETTING_KEY.SYSTEM, text: '업데이트 알림', caption: '새로운 기능이나 업데이트 소식을 알려드려요' },
  { key: NOTIFICATION_SETTING_KEY.EVENT, text: '이벤트 알림', caption: '이벤트 소식을 알려드려요' },
];

// 안드로이드는 앱 알림 설정 화면으로 바로 보내고, 안 되면(iOS 포함) 앱 설정 화면으로 보낸다
const openNotificationSettings = async () => {
  const packageName = Constants.expoConfig?.android?.package;

  if (Platform.OS === 'android' && packageName) {
    try {
      await Linking.sendIntent('android.settings.APP_NOTIFICATION_SETTINGS', [
        { key: 'android.provider.extra.APP_PACKAGE', value: packageName },
      ]);
      return;
    } catch {
      // 알림 설정 인텐트를 지원하지 않는 기기는 앱 설정 화면으로 보낸다
    }
  }

  await Linking.openSettings();
};

// 설정 화면의 알림 설정 행으로 들어오는 알림 설정 화면
const SettingNotificationScreen = () => {
  const navigation = useNavigation();
  const isPermissionGranted = useNotificationPermission();

  const { settings, updateSettings } = useNotificationSettings();

  // 개별 알림이 모두 켜져 있을 때만 전체 알림이 켜진 상태로 본다
  const isAllActive = NOTIFICATION_ITEMS.every(({ key }) => settings[key]);

  const handleToggleAll = useCallback(() => {
    updateSettings(Object.fromEntries(NOTIFICATION_ITEMS.map(({ key }) => [key, !isAllActive])));
  }, [isAllActive, updateSettings]);

  const handleToggleItem = useCallback(key => {
    updateSettings({ [key]: !settings[key] });
  }, [settings, updateSettings]);

  return (
    <SafeAreaView style={styles.container}>
      <TopSubNavigation
        type="text"
        leftIcon={IcArrowLeft}
        leftAccessibilityLabel="뒤로가기"
        headerText={HEADER_TEXT}
        onPressClose={navigation.goBack}
        showNext={false}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 기기에서 알림을 허용하지 않았을 때만 보인다 */}
        {!isPermissionGranted ? (
          <ListRow
            text="푸시 알림 사용"
            showArrow
            arrowIcon={IcArrowUpRight}
            onPress={openNotificationSettings}
          />
        ) : null}

        <ListRow
          text="전체 알림 설정"
          caption="아래에 있는 전체 알림을 한 번에 설정해요."
          showToggle
          toggleActive={isAllActive}
          onTogglePress={handleToggleAll}
          disabled={!isPermissionGranted}
        />

        {NOTIFICATION_ITEMS.map(({ key, text, caption }) => (
          <ListRow
            key={key}
            text={text}
            caption={caption}
            showToggle
            toggleActive={settings[key]}
            onTogglePress={() => handleToggleItem(key)}
            disabled={!isPermissionGranted}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSurface,
  },
});

export default SettingNotificationScreen;
