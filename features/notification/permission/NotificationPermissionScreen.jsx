import { useCallback, useEffect, useRef } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';

import IlEmptyNotification from '../../../assets/illustrations/il_empty_notification.svg';

import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from '../../../shared/components/action/Button';
import ButtonText from '../../../shared/components/action/ButtonText';

import {
  registerPushToken,
  requestNotificationPermission,
} from '../push/registerPushToken';
import { saveFirstNotificationPermissionResult } from '../push/notificationDeniedNotice';
import { useGoBackWithSignupCompleteToast } from '../../signup/signupCompleteToast';

import { colors } from '../../../shared/styles/color';
import { typo } from '../../../shared/styles/typo';
import { FONT } from '../../../shared/styles/fontType';
import { gap, padding } from '../../../shared/styles/token';

const ILLUSTRATION_SIZE = 200;

/**
 * 알림 권한 화면. 가입하면 가입 완료 화면 다음에, 이미 가입한 회원은 로그인한 다음에,
 * 온보딩에서 로그인 없이 이용하기를 누르면 피드 홈 위에 뜬다.
 * 이 기기에서 이미 답했거나 허용돼 있으면 뜨지 않는다 (shouldAskNotificationPermission)
 * - 알림 받기: OS 권한 창을 띄우고, 허용하면 푸시 토큰을 등록한다
 * - 다음에 할게요(안드로이드 뒤로가기 포함): OS 권한 창 없이 거절로 남긴다
 * 어느 쪽이든 이 화면만 닫혀 로그인 · 가입 전에 보던 화면으로 돌아간다
 *
 * params: { showSignupToast } 둘러보다가 가입했으면 돌아가서 가입을 마쳤다고 알린다
 */
const NotificationPermissionScreen = () => {
  const goBackWithSignupCompleteToast = useGoBackWithSignupCompleteToast();
  const { showSignupToast = false } = useRoute().params ?? {};

  // 권한 창이 떠 있는 사이 버튼을 다시 눌러도 한 번만 처리한다
  const isLeavingRef = useRef(false);

  const leave = useCallback(() => {
    goBackWithSignupCompleteToast(showSignupToast);
  }, [goBackWithSignupCompleteToast, showSignupToast]);

  const handlePressAllow = useCallback(async () => {
    if (isLeavingRef.current) return;
    isLeavingRef.current = true;

    try {
      if (await requestNotificationPermission()) {
        await registerPushToken();
      }
    } catch (error) {
      console.warn('알림 권한을 요청하지 못했습니다.', error?.message ?? error);
    }

    leave();
  }, [leave]);

  const handlePressLater = useCallback(() => {
    if (isLeavingRef.current) return;
    isLeavingRef.current = true;

    void saveFirstNotificationPermissionResult(false);
    leave();
  }, [leave]);

  // 안드로이드 뒤로가기는 다음에 할게요와 같다
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handlePressLater();
      return true;
    });

    return () => subscription.remove();
  }, [handlePressLater]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <IlEmptyNotification
          width={ILLUSTRATION_SIZE}
          height={ILLUSTRATION_SIZE}
        />

        <View style={styles.textContainer}>
          <Text style={styles.title}>
            편지가 도착하면 알려드릴게요
          </Text>

          <Text style={styles.body}>
            {'정해 둔 날 편지가 도착하거나\n누군가 내 기록에 반응하면 알림을 보내요.'}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          variant={BUTTON_VARIANT.SOLID}
          size={BUTTON_SIZE.XL}
          font={FONT.SUIT}
          style={styles.allowButton}
          onPress={handlePressAllow}
        >
          알림 받기
        </Button>

        <ButtonText
          text="다음에 할게요"
          style={styles.laterButton}
          onPress={handlePressLater}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSurface,
  },

  content: {
    flex: 1,
    width: '100%',
    paddingHorizontal: padding.XXL,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap.XL,
  },

  textContainer: {
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'center',
    gap: gap.M,
  },

  title: {
    ...typo.suitTitleXLargeStrong,
    alignSelf: 'stretch',
    color: colors.fgNeutralPrimary,
    textAlign: 'center',
  },

  body: {
    ...typo.suitBodyXLarge,
    alignSelf: 'stretch',
    color: colors.fgNeutralTertiary,
    textAlign: 'center',
  },

  // 화면 맨 아래에 붙인다 (가입 완료 화면 footer 와 같은 여백)
  footer: {
    paddingHorizontal: padding.L,
    paddingBottom: padding.L,
    flexDirection: 'column',
    alignItems: 'center',
    gap: gap.S,
  },

  // Button은 기본이 alignSelf: 'flex-start'라서 가로로 꽉 채운다
  allowButton: {
    alignSelf: 'stretch',
  },

  // ButtonText도 기본이 alignSelf: 'flex-start'라서 가운데에 둔다
  laterButton: {
    alignSelf: 'center',
  },
});

export default NotificationPermissionScreen;
