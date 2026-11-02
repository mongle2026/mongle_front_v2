import { useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import IcArrowLeft from '../../../../assets/icons/ic_arrow_left.svg';

import TopSubNavigation from '../../../../shared/components/navigation/topnavigation/TopSubNavigation';
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from '../../../../shared/components/action/Button';
import { Divider, DIVIDER_TYPE } from '../../../../shared/components/atomic/Divider';
import TextField from '../../../../shared/components/input/TextField';
import { useKeyboardHeight } from '../../../../shared/hooks/useFloatingBottomOffset';
import useScrollFocusedFieldToCenter from '../../../../shared/hooks/useScrollFocusedFieldToCenter';
import useCurrentUser from '../../../../shared/hooks/useCurrentUser';
import { MAIN_TAB_ROUTES } from '../../../../shared/components/navigation/bottomnavigation/routeNames';
import { useGlobalOverlay } from '../../../../shared/providers/GlobalOverlayProvider';
import { getApiErrorMessage } from '../../../../shared/api/client';

import { colors } from '../../../../shared/styles/color';
import { FONT } from '../../../../shared/styles/fontType';
import { gap, padding } from '../../../../shared/styles/token';
import { typo } from '../../../../shared/styles/typo';

import CheckContainer from '../../components/CheckContainer';
import { ID_MAX_LENGTH } from '../../../profile/hooks/useProfileForm';
import useWithdraw from '../../../auth/hooks/useWithdraw';

const HEADER_TEXT = '계정 탈퇴';

const getIdDescription = ({ id, isIdMatched }) => {
  if (!id) return '가입되어 있는 아이디를 입력하세요.';
  if (isIdMatched) return '가입된 아이디와 같습니다.';
  return '가입되어 있는 아이디와 일치하지 않습니다.';
};

const getIdStatus = ({ id, isIdMatched }) => {
  if (!id) return undefined;
  return isIdMatched ? 'positive' : 'error';
};

// 계정 정보 화면의 계정 탈퇴 행으로 들어오는 계정 탈퇴 화면
const SettingAccountWithdrawScreen = () => {
  const navigation = useNavigation();
  const { currentUser } = useCurrentUser();

  const [isChecked, setIsChecked] = useState(false);
  const [id, setId] = useState('');

  const isIdMatched = Boolean(currentUser?.userCode) && id === currentUser.userCode;
  const canWithdraw = isChecked && isIdMatched;

  const insets = useSafeAreaInsets();
  const { showToast } = useGlobalOverlay();

  const { withdraw, isWithdrawing } = useWithdraw({
    // 설정 · 계정 정보를 빼고 피드 탭으로 돌아간 뒤 로그아웃한다
    onSuccess: () => {
      navigation.popTo('MainTabs', { screen: MAIN_TAB_ROUTES.FEED });
    },
    onError: error => {
      showToast({
        message: getApiErrorMessage(error, '탈퇴하지 못했습니다.'),
        icon: 'alert',
        iconColor: colors.fgCriticalInverted,
        bottomOffset: insets.bottom,
      });
    },
  });

  const handlePressWithdraw = () => {
    if (!canWithdraw || isWithdrawing) return;

    withdraw({ provider: currentUser.provider });
  };
  const keyboardHeight = useKeyboardHeight();

  const isKeyboardVisible = keyboardHeight > 0;

  // ScrollView를 키보드 높이만큼 줄여서 아래 내용까지 스크롤로 올릴 수 있게 한다.
  // SafeAreaView가 이미 아래 안전영역만큼 띄워 두었으니 그만큼은 뺀다
  const keyboardInset = Math.max(0, keyboardHeight - insets.bottom);

  // 입력창에 포커스하면 키보드 위로 보이는 영역의 가운데로 스크롤한다
  const idFieldRef = useRef(null);
  const {
    scrollViewRef,
    handleScrollViewLayout,
    focusField,
    blurField,
  } = useScrollFocusedFieldToCenter({ isKeyboardVisible });

  // 키보드가 내려가 있을 때의 ScrollView 높이. 내용 최소 높이로 써서
  // 키보드가 올라와도 탈퇴하기 버튼이 따라 올라오지 않고 키보드 아래에 남게 한다
  const [fullHeight, setFullHeight] = useState(0);

  const handleLayout = event => {
    if (!isKeyboardVisible) {
      setFullHeight(event.nativeEvent.layout.height);
    }

    handleScrollViewLayout(event);
  };

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

      <ScrollView
        ref={scrollViewRef}
        onLayout={handleLayout}
        style={[styles.scrollView, { marginBottom: keyboardInset }]}
        contentContainerStyle={[
          styles.scrollContent,
          fullHeight > 0 && { minHeight: fullHeight },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.agreement}>
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>정말 계정을 탈퇴하시겠어요?</Text>
              <Text style={styles.noticeBody}>
                {'작성한 글, 받은 편지, 프로필 등 모든 정보가 삭제됩니다.\n다만, 타인에게 보낸 편지, 댓글은 삭제되지 않습니다.'}
              </Text>
            </View>

            <CheckContainer
              text="안내 사항을 모두 확인했으며, 이에 동의합니다."
              selected={isChecked}
              onPress={() => setIsChecked(checked => !checked)}
            />
          </View>

          <Divider type={DIVIDER_TYPE.FILL} />

          <TextField
            containerRef={idFieldRef}
            onFocus={() => focusField(idFieldRef)}
            onBlur={() => blurField(idFieldRef)}
            label="아이디"
            required
            value={id}
            onChangeText={setId}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={Platform.OS === 'android' ? 'visible-password' : 'default'}
            placeholder="아이디를 입력해주세요"
            description={getIdDescription({ id, isIdMatched })}
            maxLength={ID_MAX_LENGTH}
            showCounter={false}
            status={getIdStatus({ id, isIdMatched })}
          />
        </View>

        <View style={styles.footer}>
          <Button
            variant={canWithdraw ? BUTTON_VARIANT.CRITICAL : BUTTON_VARIANT.DISABLED}
            size={BUTTON_SIZE.XL}
            font={FONT.SUIT}
            style={styles.withdrawButton}
            loading={isWithdrawing}
            onPress={handlePressWithdraw}
          >
            탈퇴하기
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSurface,
  },

  scrollView: {
    flex: 1,
  },

  // 내용이 짧을 때도 화면을 채워서 footer가 맨 아래에 붙게 한다
  scrollContent: {
    flexGrow: 1,
  },

  content: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.L,
    alignSelf: 'stretch',
  },

  // 안내 문구 + 동의 체크
  agreement: {
    paddingBottom: padding.M,
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },

  notice: {
    paddingVertical: padding.XL,
    paddingHorizontal: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.M,
    alignSelf: 'stretch',
  },

  noticeTitle: {
    ...typo.suitTitleMediumStrong,
    alignSelf: 'stretch',
    color: colors.fgNeutralPrimary,
  },

  noticeBody: {
    ...typo.suitBodyMedium,
    alignSelf: 'stretch',
    color: colors.fgNeutralPrimary,
  },

  // 화면 맨 아래에 붙인다
  footer: {
    width: '100%',
    marginTop: 'auto',
    padding: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.M,
  },

  // Button은 기본이 alignSelf: 'flex-start'라서 가로로 꽉 채운다
  withdrawButton: {
    alignSelf: 'stretch',
  },
});

export default SettingAccountWithdrawScreen;
