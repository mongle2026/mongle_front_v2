import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import IcArrowLeft from '../../assets/icons/ic_arrow_left.svg';

import TopSubNavigation from '../../shared/components/navigation/topnavigation/TopSubNavigation';
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from '../../shared/components/action/Button';
import CheckboxRow, { CHECK_POSITION } from '../../shared/components/input/CheckboxRow';
import TextField from '../../shared/components/input/TextField';
import { useKeyboardHeight } from '../../shared/hooks/useFloatingBottomOffset';
import useScrollFocusedFieldToCenter from '../../shared/hooks/useScrollFocusedFieldToCenter';
import { getApiErrorMessage } from '../../shared/api/client';
import { useGlobalOverlay } from '../../shared/providers/GlobalOverlayProvider';

import { colors } from '../../shared/styles/color';
import { FONT } from '../../shared/styles/fontType';
import { gap, padding } from '../../shared/styles/token';
import { typo } from '../../shared/styles/typo';

import TargetCard from './components/TargetCard';
import useReport from './hooks/useReport';
import {
  ETC_REASON_MAX_LENGTH,
  REPORT_REASON,
  REPORT_REASONS,
  REPORT_TARGET_TYPE,
} from './constants';

const HEADER_TEXT = '신고하기';

// '이미 신고한 ○○예요.' Toast 에 들어가는 대상 이름
const ALREADY_REPORTED_TARGET_NAME = {
  [REPORT_TARGET_TYPE.FEED]: '피드',
  [REPORT_TARGET_TYPE.COMMENT]: '댓글',
  [REPORT_TARGET_TYPE.LETTER]: '편지',
  [REPORT_TARGET_TYPE.USER]: '사용자',
};
const ETC_REASON_MAX_LINES = 4;

// 피드 · 댓글 · 편지 · 사용자 신고 화면.
// params: { type: REPORT_TARGET_TYPE, targetId, userCode, profileImageUrl, preview, toastBottomOffset }
// targetId: 피드 · 댓글 · 편지는 id, 사용자는 publicId
// toastBottomOffset: 돌아간 화면에서 결과 Toast 를 띄울 높이 (그 화면의 다른 Toast 와 같은 위치)
const ReportScreen = () => {
  const navigation = useNavigation();
  const { params } = useRoute();
  const {
    type,
    targetId,
    userCode,
    profileImageUrl,
    preview,
    toastBottomOffset = 0,
  } = params ?? {};

  const { showToast } = useGlobalOverlay();

  // 실패 토스트를 신고하기 버튼 위에 띄우려고 footer 높이를 잰다
  const [footerHeight, setFooterHeight] = useState(0);

  const { report, isReporting } = useReport({
    // 이전 화면으로 돌아가서 결과를 Toast로 알린다.
    // 이미 신고한 대상이면 서버가 다시 저장하지 않고 isAlreadyReported: true 로 응답한다
    onSuccess: data => {
      navigation.goBack();

      if (data?.isAlreadyReported) {
        showToast({
          message: `이미 신고한 ${ALREADY_REPORTED_TARGET_NAME[type] ?? '내용'}예요.`,
          icon: 'info',
          iconColor: colors.fgInfoInverted,
          bottomOffset: toastBottomOffset,
        });
        return;
      }

      showToast({
        message: '신고가 접수됐어요.',
        icon: 'check',
        iconColor: colors.fgPositiveInverted,
        bottomOffset: toastBottomOffset,
      });
    },
    onError: error => {
      showToast({
        message: getApiErrorMessage(error, '신고하지 못했어요. 다시 시도해 주세요.'),
        icon: 'alert',
        iconColor: colors.fgCriticalInverted,
        bottomOffset: footerHeight,
      });
    },
  });

  const [selectedReason, setSelectedReason] = useState(null);
  const [etcReason, setEtcReason] = useState('');

  const isEtcSelected = selectedReason === REPORT_REASON.ETC;
  // 기타는 사유를 적어야 신고할 수 있다
  const canReport =
    selectedReason !== null && (!isEtcSelected || etcReason.trim().length > 0);

  const handlePressReason = reason => {
    setSelectedReason(previous => (previous === reason ? null : reason));
  };

  const handlePressReport = () => {
    if (!canReport || isReporting || targetId == null) return;

    report({
      type,
      targetId,
      reason: selectedReason,
      // 기타 사유는 기타를 골랐을 때만 보낸다
      detail: isEtcSelected ? etcReason.trim() : undefined,
    });
  };

  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  const isKeyboardVisible = keyboardHeight > 0;

  // ScrollView를 키보드 높이만큼 줄여서 아래 내용까지 스크롤로 올릴 수 있게 한다.
  // SafeAreaView가 이미 아래 안전영역만큼 띄워 두었으니 그만큼은 뺀다
  const keyboardInset = Math.max(0, keyboardHeight - insets.bottom);

  // 입력창에 포커스하면 키보드 위로 보이는 영역의 가운데로 스크롤한다
  const etcFieldRef = useRef(null);
  const {
    scrollViewRef,
    handleScrollViewLayout,
    focusField,
    blurField,
  } = useScrollFocusedFieldToCenter({ isKeyboardVisible });

  // 키보드가 내려가 있을 때의 ScrollView 높이. 내용 최소 높이로 써서
  // 키보드가 올라와도 신고하기 버튼이 따라 올라오지 않고 키보드 아래에 남게 한다
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
        <View style={styles.body}>
          <View style={styles.titleArea}>
            <Text style={styles.title}>신고 사유를 선택해 주세요</Text>
            <Text style={styles.description}>
              신고 내용은 운영 정책에 따라 검토 후 처리돼요.
            </Text>
          </View>

          <View style={styles.targetContainer}>
            <TargetCard
              type={type}
              userCode={userCode}
              profileImageUrl={profileImageUrl}
              preview={preview}
            />
          </View>

          {REPORT_REASONS.map(({ key, label }) => (
            <CheckboxRow
              key={key}
              text={label}
              selected={selectedReason === key}
              checkPosition={CHECK_POSITION.TAIL}
              onPress={() => handlePressReason(key)}
            />
          ))}

          {isEtcSelected && (
            <TextField
              containerRef={etcFieldRef}
              onFocus={() => focusField(etcFieldRef)}
              onBlur={() => blurField(etcFieldRef)}
              label="기타사유"
              prefix={null}
              value={etcReason}
              onChangeText={setEtcReason}
              placeholder="신고 사유를 입력해 주세요"
              description="최대 200자까지 입력할 수 있어요"
              maxLength={ETC_REASON_MAX_LENGTH}
              maxLines={ETC_REASON_MAX_LINES}
            />
          )}
        </View>

        <View
          style={styles.footer}
          onLayout={event => setFooterHeight(event.nativeEvent.layout.height)}
        >
          <Button
            variant={
              canReport && !isReporting
                ? BUTTON_VARIANT.SOLID
                : BUTTON_VARIANT.DISABLED
            }
            size={BUTTON_SIZE.XL}
            font={FONT.SUIT}
            style={styles.reportButton}
            onPress={handlePressReport}
          >
            신고하기
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

  body: {
    flexGrow: 1,
    paddingBottom: padding.M,
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },

  titleArea: {
    paddingVertical: padding.XL,
    paddingHorizontal: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.M,
    alignSelf: 'stretch',
  },

  title: {
    ...typo.suitTitleSmall,
    color: colors.fgNeutralPrimary,
  },

  description: {
    ...typo.suitBodySmall400,
    color: colors.fgNeutralPrimary,
  },

  targetContainer: {
    paddingHorizontal: padding.L,
    paddingBottom: padding.XL,
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
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
  reportButton: {
    alignSelf: 'stretch',
  },
});

export default ReportScreen;
