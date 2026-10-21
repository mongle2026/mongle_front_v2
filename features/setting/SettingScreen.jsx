import { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import IcArrowLeft from '../../assets/icons/ic_arrow_left.svg';

import TopSubNavigation from '../../shared/components/navigation/topnavigation/TopSubNavigation';
import ListHeader from '../../shared/components/content/ListHeader';

import { colors } from '../../shared/styles/color';
import { padding } from '../../shared/styles/token';

import ListRow from './components/ListRow';
import useNotificationPermission from './hooks/useNotificationPermission';
import useNotificationSettings, { NOTIFICATION_SETTING_KEY } from './hooks/useNotificationSettings';

const HEADER_TEXT = '설정';
const APP_VERSION = '버전 정보v1.0';

const NIGHT_ALERT_CAPTION_ON = '오후 9시~오전 8시에도 알림을 받아요.';
const NIGHT_ALERT_CAPTION_OFF = '오후 9시 이후 알림은 오전 8시에 모아서 보내드려요.';

// 프로필 탭 오른쪽 위 설정 버튼으로 들어오는 설정 화면
const SettingScreen = () => {
  const navigation = useNavigation();
  const isPermissionGranted = useNotificationPermission();

  const { settings, updateSettings } = useNotificationSettings();
  const isNightAlertActive = settings[NOTIFICATION_SETTING_KEY.NIGHT];

  const handleToggleNightAlert = useCallback(() => {
    updateSettings({ [NOTIFICATION_SETTING_KEY.NIGHT]: !isNightAlertActive });
  }, [isNightAlertActive, updateSettings]);

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
        <View style={styles.section}>
          <ListHeader title="회원 정보" textStyle={styles.headerText} />
          <ListRow text="계정 정보" showArrow />
          <ListRow
            text="프로필 정보 편집"
            showArrow
            onPress={() => navigation.navigate('ProfileInfoEdit')}
          />
        </View>

        <View style={styles.section}>
          <ListHeader title="알림" textStyle={styles.headerText} />
          <ListRow
            text="야간 알림"
            caption={isNightAlertActive ? NIGHT_ALERT_CAPTION_ON : NIGHT_ALERT_CAPTION_OFF}
            showToggle
            toggleActive={isNightAlertActive}
            onTogglePress={handleToggleNightAlert}
            disabled={!isPermissionGranted}
          />
          <ListRow
            text="알림 설정"
            showArrow
            onPress={() => navigation.navigate('SettingNotification')}
          />
        </View>

        <View style={styles.section}>
          <ListHeader title="약관 및 정책" textStyle={styles.headerText} />
          <ListRow text="개인정보처리방침" showArrow />
          <ListRow text="이용약관" showArrow />
        </View>

        <View style={styles.section}>
          <ListHeader title="고객 지원" textStyle={styles.headerText} />
          <ListRow text="피드백 보내기" showArrow />
        </View>

        <ListRow caption={APP_VERSION} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSurface,
  },

  section: {
    paddingBottom: padding.XXL,
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },

  headerText: {
    color: colors.fgNeutralTertiary,
  },
});

export default SettingScreen;
