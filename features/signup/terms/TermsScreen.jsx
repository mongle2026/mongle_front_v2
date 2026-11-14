import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';

import IcX from '../../../assets/icons/ic_x.svg';
import IcArrowUpRight from '../../../assets/icons/ic_arrow_up_right.svg';

import TopSubNavigation from '../../../shared/components/navigation/topnavigation/TopSubNavigation';
import IconButton from '../../../shared/components/action/IconButton';
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from '../../../shared/components/action/Button';
import CheckboxRow from '../../../shared/components/input/CheckboxRow';
import { defaultProfileImgQuery } from '../hooks/useDefaultProfileImg';

import { colors } from '../../../shared/styles/color';
import { typo } from '../../../shared/styles/typo';
import { FONT } from '../../../shared/styles/fontType';
import { gap, padding } from '../../../shared/styles/token';

const HEADER_TEXT = '약관 동의';
const WELCOME_TEXT = '당신의 추억이 음악을 남는 곳,\n몽글에 오신 걸 환영합니다!';

// url이 있는 항목만 오른쪽에 전문 보기 버튼을 둔다
const TERMS = [
  {
    key: 'age',
    label: '(필수) 만 14세 이상입니다',
    required: true,
  },
  {
    key: 'service',
    label: '(필수) 이용 약관 동의',
    required: true,
    url: 'https://mongle-music-letter.notion.site/4058a27574f080d49a63e15237a48fb3',
  },
  {
    key: 'privacy',
    label: '(필수) 개인정보 수집 및 이용 동의',
    required: true,
    url: 'https://mongle-music-letter.notion.site/4058a27574f0800e9b0fd1a49021ad73',
  },
  {
    key: 'marketing',
    label: '(선택) 광고성 정보 수신',
    required: false,
  },
];

const INITIAL_AGREEMENTS = Object.fromEntries(TERMS.map(({ key }) => [key, false]));

const TermsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [agreements, setAgreements] = useState(INITIAL_AGREEMENTS);
  const queryClient = useQueryClient();

  // 가입 화면에 들어가자마자 기본 프로필 사진이 보이도록 약관을 읽는 동안 미리 받아 둔다
  useEffect(() => {
    queryClient.prefetchQuery(defaultProfileImgQuery);
  }, [queryClient]);

  const isAllAgreed = TERMS.every(({ key }) => agreements[key]);
  const isRequiredAgreed = TERMS.every(({ key, required }) => !required || agreements[key]);

  const handlePressTerm = key => {
    setAgreements(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // 전체 동의를 누르면 모든 항목을 같은 값으로 맞춘다
  const handlePressAll = () => {
    const next = !isAllAgreed;
    setAgreements(Object.fromEntries(TERMS.map(({ key }) => [key, next])));
  };

  const handlePressSubmit = () => {
    // 로그인에서 받은 signupToken · suggestedNickname 에 광고성 정보 수신 동의 여부를 더해 넘긴다
    navigation.navigate('Signup', {
      ...route.params,
      isMarketingAgreed: agreements.marketing,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopSubNavigation
        type="text"
        headerText={HEADER_TEXT}
        leftIcon={IcX}
        onPressClose={navigation.goBack}
        showNext={false}
      />

      <View style={styles.welcome}>
        <Text style={styles.welcomeText}>{WELCOME_TEXT}</Text>
      </View>

      <View style={styles.agreements}>
        <View style={styles.termList}>
          {TERMS.map(({ key, label, url }) => (
            <View key={key} style={styles.termRow}>
              <CheckboxRow
                text={label}
                selected={agreements[key]}
                onPress={() => handlePressTerm(key)}
                style={styles.termCheck}
              />

              {url && (
                <IconButton
                  icon={IcArrowUpRight}
                  size="M"
                  color={colors.fgNeutralTertiary}
                  onPress={() => WebBrowser.openBrowserAsync(url)}
                  accessibilityLabel={`${label} 전문 보기`}
                />
              )}
            </View>
          ))}
        </View>

        <CheckboxRow
          text="전체 동의"
          selected={isAllAgreed}
          onPress={handlePressAll}
        />

        <View style={styles.footer}>
          <Button
            variant={isRequiredAgreed ? BUTTON_VARIANT.SOLID : BUTTON_VARIANT.DISABLED}
            size={BUTTON_SIZE.XL}
            font={FONT.SUIT}
            style={styles.submitButton}
            onPress={handlePressSubmit}
          >
            다음으로
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.L,
    backgroundColor: colors.bgSurface,
  },

  welcome: {
    paddingVertical: padding.XL,
    paddingHorizontal: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.M,
    alignSelf: 'stretch',
  },

  welcomeText: {
    ...typo.suitTitleSmall,
    alignSelf: 'stretch',
    color: colors.fgNeutralPrimary,
  },

  // 약관 목록 · 전체 동의 · 버튼을 묶어 화면 하단으로 민다
  // 안쪽 행이 width 100%라서 부모도 가로를 채워야 한다
  agreements: {
    marginTop: 'auto',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.M,
  },

  termList: {
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },

  termRow: {
    width: '100%',
    paddingRight: padding.M,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // CheckboxRow는 기본이 width 100%라서 IconButton 자리를 남기도록 늘어나게만 둔다
  termCheck: {
    flex: 1,
  },

  footer: {
    width: '100%',
    padding: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.M,
  },

  // Button은 기본이 alignSelf: 'flex-start'라서 가로로 꽉 채운다
  submitButton: {
    alignSelf: 'stretch',
  },
});

export default TermsScreen;
