import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import IcArrowLeft from '../../../assets/icons/ic_arrow_left.svg';
import IcFilledCheck from '../../../assets/icons/ic_filledcheck.svg';

import TopSubNavigation from '../../../shared/components/navigation/topnavigation/TopSubNavigation';
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from '../../../shared/components/action/Button';

import { colors } from '../../../shared/styles/color';
import { typo } from '../../../shared/styles/typo';
import { FONT } from '../../../shared/styles/fontType';
import { gap, padding } from '../../../shared/styles/token';

const CHECK_ICON_SIZE = 24;

// TODO: 약관 내용이 정해지면 항목별 동의 · 전문 보기를 붙인다. 지금은 전체 동의 체크 하나만 둔다
const TermsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [isAgreed, setIsAgreed] = useState(false);

  const handlePressAgree = () => {
    setIsAgreed(prev => !prev);
  };

  const handlePressSubmit = () => {
    // 로그인에서 받은 signupToken · suggestedNickname 을 그대로 넘긴다
    navigation.navigate('Signup', route.params);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopSubNavigation
        leftIcon={IcArrowLeft}
        leftAccessibilityLabel="뒤로가기"
        onPressClose={navigation.goBack}
        showShare={false}
        showMore={false}
      />

      <View style={styles.content} />

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isAgreed }}
          onPress={handlePressAgree}
          style={styles.agree}
        >
          <IcFilledCheck
            width={CHECK_ICON_SIZE}
            height={CHECK_ICON_SIZE}
            color={isAgreed ? colors.fgNeutralPrimary : colors.fgDisabled}
          />
          <Text style={styles.agreeLabel}>약관 동의하기</Text>
        </Pressable>

        <Button
          variant={isAgreed ? BUTTON_VARIANT.SOLID : BUTTON_VARIANT.DISABLED}
          size={BUTTON_SIZE.XL}
          font={FONT.SUIT}
          style={styles.submitButton}
          onPress={handlePressSubmit}
        >
          가입하기
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

  // 약관 내용이 들어올 자리. 남은 높이를 채워서 footer를 맨 아래로 민다
  content: {
    flex: 1,
  },

  footer: {
    width: '100%',
    padding: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.M,
  },

  agree: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.M,
  },

  agreeLabel: {
    ...typo.suitLabelXLarge,
    color: colors.fgNeutralPrimary,
  },

  // Button은 기본이 alignSelf: 'flex-start'라서 가로로 꽉 채운다
  submitButton: {
    alignSelf: 'stretch',
  },
});

export default TermsScreen;
