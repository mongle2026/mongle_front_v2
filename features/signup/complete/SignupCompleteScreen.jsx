import { useCallback, useEffect } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from '../../../shared/components/action/Button';

import ProfileUserRow from '../../profile/components/ProfileUserRow';

import { colors } from '../../../shared/styles/color';
import { typo } from '../../../shared/styles/typo';
import { FONT } from '../../../shared/styles/fontType';
import { gap, padding, radius } from '../../../shared/styles/token';

/**
 * 가입 완료. 가입 화면에서 넘어온 뒤 로그인되면서 Welcome · 약관 · 가입 화면이 아래에서 빠진다.
 * 시작하기(안드로이드 뒤로가기 포함)를 누르면 이 화면만 닫혀 가입 전에 보던 화면으로 돌아간다
 *
 * params: { nickname, userCode, profileImgUri }
 */
const SignupCompleteScreen = () => {
  const navigation = useNavigation();
  const { nickname, userCode, profileImgUri } = useRoute().params ?? {};

  const handlePressStart = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 안드로이드 뒤로가기도 시작하기와 같게 이 화면만 닫는다
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handlePressStart();
      return true;
    });

    return () => subscription.remove();
  }, [handlePressStart]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 기울어진 아이디 버튼의 가장 아래 꼭짓점에 사진 밑변을 맞춘다 (프로필 화면과 같은 행) */}
        <ProfileUserRow
          imageUri={profileImgUri}
          userCode={userCode}
          style={styles.profileRow}
          profileImgStyle={styles.profileImg}
        />

        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {nickname} 님, 반가워요!
          </Text>

          <Text style={styles.body}>
            {'이제 음악과 함께 기록을 남기고\n편지를 주고받을 수 있어요.'}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          variant={BUTTON_VARIANT.SOLID}
          size={BUTTON_SIZE.XL}
          font={FONT.SUIT}
          style={styles.startButton}
          onPress={handlePressStart}
        >
          시작하기
        </Button>
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
    gap: gap.L,
  },

  // 크기 · 아래 여백 · 회전은 ProfileUserRow 가 정한다
  profileRow: {
    justifyContent: 'center',
  },

  profileImg: {
    borderRadius: radius.S,
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

  // 화면 맨 아래에 붙인다
  footer: {
    paddingHorizontal: padding.L,
    paddingBottom: padding.L,
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.S,
  },

  // Button은 기본이 alignSelf: 'flex-start'라서 가로로 꽉 채운다
  startButton: {
    flex: 1,
  },
});

export default SignupCompleteScreen;
