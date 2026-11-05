import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import IcArrowLeft from '../../../../assets/icons/ic_arrow_left.svg';

import TopSubNavigation from '../../../../shared/components/navigation/topnavigation/TopSubNavigation';
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from '../../../../shared/components/action/Button';
import TextField from '../../../../shared/components/input/TextField';
import { useKeyboardHeight } from '../../../../shared/hooks/useFloatingBottomOffset';
import useScrollFocusedFieldToCenter from '../../../../shared/hooks/useScrollFocusedFieldToCenter';
import { formatDate } from '../../../../shared/utils/dateUtils';
import { useAuthStore } from '../../../../shared/auth/useAuthStore';
import { useGlobalOverlay } from '../../../../shared/providers/GlobalOverlayProvider';
import { getApiErrorMessage } from '../../../../shared/api/client';

import { colors } from '../../../../shared/styles/color';
import { FONT } from '../../../../shared/styles/fontType';
import { gap, padding, radius } from '../../../../shared/styles/token';
import { typo } from '../../../../shared/styles/typo';

import { REPORT_REASONS } from '../../../report/constants';
import useAppeal from './hooks/useAppeal';

const HEADER_TEXT = '이의 신청';

const APPEAL_MAX_LENGTH = 500;
const APPEAL_MAX_LINES = 4;

// 영구 제한이면 restrictedUntil 이 null 이다
const PERMANENT_LABEL = '영구';

/**
 * 이용 제한에 이의 신청하는 화면. 제재 화면(AccountRestrictedScreen)에서 들어온다
 *
 * params: { reason, restrictedUntil, toastBottomOffset }
 * - reason, restrictedUntil: 제재 화면과 같은 값
 * - toastBottomOffset: 접수되고 제재 화면으로 돌아가서 띄우는 토스트 위치 (안드로이드 하단 네비게이션 바 위)
 *
 * 접수되면 restriction.appealStatus 를 서버가 준 값(검토 중)으로 바꿔서 제재 화면 버튼을 막는다
 */
const AppealScreen = () => {
  const navigation = useNavigation();
  const {
    reason,
    restrictedUntil,
    toastBottomOffset = 0,
  } = useRoute().params ?? {};

  const { showToast } = useGlobalOverlay();
  const setRestriction = useAuthStore(state => state.setRestriction);

  const reasonLabel =
    REPORT_REASONS.find(item => item.key === reason)?.label ?? reason;
  const untilLabel = restrictedUntil
    ? formatDate(restrictedUntil)
    : PERMANENT_LABEL;

  const [content, setContent] = useState('');

  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  const isKeyboardVisible = keyboardHeight > 0;

  const { appeal, isAppealing } = useAppeal({
    // 제재 화면으로 돌아가서 결과를 Toast로 알린다.
    // 이미 이의 신청한 제한이면 서버가 다시 저장하지 않고 그 신청의 상태를 준다
    onSuccess: data => {
      const { restriction } = useAuthStore.getState();

      if (restriction) {
        setRestriction({
          ...restriction,
          appealStatus: data?.appealStatus ?? null,
        });
      }

      navigation.goBack();

      showToast({
        message: '이의 신청이 접수됐어요.',
        icon: 'check',
        iconColor: colors.fgPositiveInverted,
        bottomOffset: toastBottomOffset,
      });
    },
    onError: error => {
      showToast({
        message: getApiErrorMessage(error, '이의 신청하지 못했어요. 다시 시도해 주세요.'),
        icon: 'alert',
        iconColor: colors.fgCriticalInverted,
        // 제출하기 버튼과 겹쳐도 되고, 안드로이드 하단 네비게이션 바 위에만 뜨면 된다.
        // 키보드가 올라와 있으면 키보드에 가리지 않게 키보드 위에 띄운다
        bottomOffset: isKeyboardVisible ? keyboardHeight : insets.bottom,
      });
    },
  });

  const canSubmit = content.trim().length > 0 && !isAppealing;

  const handlePressSubmit = () => {
    if (!canSubmit) return;

    appeal({ content: content.trim() });
  };

  // ScrollView를 키보드 높이만큼 줄여서 아래 내용까지 스크롤로 올릴 수 있게 한다.
  // SafeAreaView가 이미 아래 안전영역만큼 띄워 두었으니 그만큼은 뺀다
  const keyboardInset = Math.max(0, keyboardHeight - insets.bottom);

  // 입력창에 포커스하면 키보드 위로 보이는 영역의 가운데로 스크롤한다
  const contentFieldRef = useRef(null);
  const {
    scrollViewRef,
    handleScrollViewLayout,
    focusField,
    blurField,
  } = useScrollFocusedFieldToCenter({ isKeyboardVisible });

  // 키보드가 내려가 있을 때의 ScrollView 높이. 내용 최소 높이로 써서
  // 키보드가 올라와도 제출하기 버튼이 따라 올라오지 않고 키보드 아래에 남게 한다
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
            <Text style={styles.title}>이의 신청 내용을 알려 주세요</Text>
            <Text style={styles.description}>
              {'제한 조치가 잘못되었다고 생각되면 의견을 남겨 주세요.\n검토 결과는 알림으로 알려 드릴게요.'}
            </Text>
          </View>

          <View style={styles.summaryContainer}>
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>제한 사유</Text>
                <Text style={styles.summaryValue}>{reasonLabel}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>제한 기간</Text>
                <Text style={styles.summaryValue}>{untilLabel}</Text>
              </View>
            </View>
          </View>

          <TextField
            containerRef={contentFieldRef}
            onFocus={() => focusField(contentFieldRef)}
            onBlur={() => blurField(contentFieldRef)}
            label="이의 신청 내용"
            prefix={null}
            value={content}
            onChangeText={setContent}
            placeholder="제한 조치에 대한 의견을 적어 주세요."
            description="최대 500자까지 입력할 수 있어요"
            maxLength={APPEAL_MAX_LENGTH}
            maxLines={APPEAL_MAX_LINES}
          />
        </View>

        <View style={styles.footer}>
          <Button
            variant={canSubmit ? BUTTON_VARIANT.SOLID : BUTTON_VARIANT.DISABLED}
            size={BUTTON_SIZE.XL}
            font={FONT.SUIT}
            style={styles.submitButton}
            onPress={handlePressSubmit}
          >
            제출하기
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
    ...typo.suitTitleMediumStrong,
    color: colors.fgNeutralPrimary,
  },

  description: {
    ...typo.suitBodyMedium,
    color: colors.fgNeutralPrimary,
  },

  summaryContainer: {
    paddingHorizontal: padding.L,
    paddingBottom: padding.XL,
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },

  summary: {
    padding: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.M,
    alignSelf: 'stretch',
    borderRadius: radius.S,
    backgroundColor: colors.fillNeutralWeak,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.L,
    alignSelf: 'stretch',
  },

  summaryLabel: {
    ...typo.suitBodyMedium,
    color: colors.fgNeutralSecondary,
  },

  summaryValue: {
    ...typo.suitLabelLargeStrong,
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
  submitButton: {
    alignSelf: 'stretch',
  },
});

export default AppealScreen;
