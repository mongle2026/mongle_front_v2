import React, { useCallback, useEffect } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Icons
import IcProfile from '../../../assets/icons/ic_profile.svg';
import IcCalendar from '../../../assets/icons/ic_calendar.svg';

// Shared Components & Providers
import { DividerLine } from '../../../shared/components/atomic/DividerLine';
import Profile from '../../../shared/components/content/profile/Profile';
import TopIconNavigation from '../../../shared/components/navigation/topnavigation/TopIconNavigation';
import { useGlobalOverlay } from '../../../shared/providers/GlobalOverlayProvider';

// Shared Hooks & Utils
import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import { resolveMediaUri } from '../../../shared/utils/media';
import { dismissKeyboardThen } from '../../../shared/utils/keyboardUtils';
import { getApiErrorMessage } from '../../../shared/api/client';

// Shared Styles
import { colors } from '../../../shared/styles/color';
import { gap, padding } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';

// Feature Components, Stores & Utils
import LabeledButton from '../components/LabeledButton';
import RecordEditorBody from './components/RecordEditorBody';
import RecipientSelectBottomSheet from '../recipient/components/RecipientSelectBottomSheet';
import DateSelectBottomSheet from '../date/components/DateSelectBottomSheet';
import { useRecordFormStore } from '../store/useRecordFormStore';
import { useLetterFormStore } from '../store/useLetterFormStore';
import { deliveryAtToDate, formatDeliveryDateLabel, toDeliveryAt } from '../date/utils/deliveryDate';
import { fullScreenOverlayContainerStyle } from '../utils/overlayContainerStyle';

// Hooks
import useRecordEditor from './hooks/useRecordEditor';
import useCreateFeed from './hooks/useCreateFeed';
import { useLeaveRecordConfirm } from './hooks/useLeaveRecordConfirm';

const RECORD_TYPE = {
  FEED: 'feed',
  LETTER: 'letter',
};

const MUSIC_SELECT_OVERLAY_ID = 'record-music-select';
const RECIPIENT_SELECT_OVERLAY_ID = 'record-recipient-select';
const DATE_SELECT_OVERLAY_ID = 'record-date-select';

const RecordScreen = ({ navigation, route }) => {
  /* 현재 로그인 사용자 */
  const { userId } = useCurrentUser();

  /* 피드 / 편지 공통 작성 상태 (음악 · 본문 · 이미지 · 폰트 · 하단 바) */
  const editor = useRecordEditor({
    navigation,
    musicSelectOverlayId: MUSIC_SELECT_OVERLAY_ID,
  });

  const {
    hasMusic,
    hasContent,
    normalizedFont,
    dateTypography,
    bottomOffset,
  } = editor;

  const resetRecordForm = useRecordFormStore(state => state.resetRecordForm);

  /* 편지 전용 작성 데이터 */
  const receiver = useLetterFormStore(state => state.receiver);
  const deliveryAt = useLetterFormStore(state => state.deliveryAt);
  const setDeliveryAt = useLetterFormStore(state => state.setDeliveryAt);
  const resetLetterForm = useLetterFormStore(state => state.resetLetterForm);

  /* feed / letter 구분 */
  const type = route?.params?.type ?? RECORD_TYPE.FEED;
  const isLetter = type === RECORD_TYPE.LETTER;

  /*
   * 타인에게 보내는 편지일 때만
   * '즉시' 버튼과 오늘 날짜 선택을 허용합니다.
   * (나에게 보내는 편지는 오늘 선택 불가)
   */
  const canSelectToday =
    isLetter && Boolean(receiver) && !receiver.isMe;

  /*
   * 타인 -> 나 로 수신인을 바꾸면
   * 이미 골라둔 '오늘(즉시)' 또는 지난 날짜는 무효이므로 비웁니다.
   */
  useEffect(() => {
    if (!isLetter || canSelectToday || !deliveryAt) {
      return;
    }

    const selected = deliveryAtToDate(deliveryAt);
    if (!selected) {
      return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (selected.getTime() <= todayStart.getTime()) {
      setDeliveryAt(null);
    }
  }, [isLetter, canSelectToday, deliveryAt, setDeliveryAt]);

  /* 다음 버튼 활성 색상 조건 */
  const hasRecipient = !isLetter || Boolean(receiver);
  const hasDeliveryDate = !isLetter || Boolean(deliveryAt);
  const isNextReady = hasMusic && hasContent && hasRecipient && hasDeliveryDate;
  const nextTextColor = isNextReady ? colors.fgNeutralMuted : colors.fgDisabled;

  /* 작성 중인 값이 하나라도 있는지 (뒤로가기 시 확인 Dialog 노출 여부) */
  const hasWrittenAnything =
    hasMusic ||
    hasContent ||
    (isLetter && (Boolean(receiver) || Boolean(deliveryAt)));

  const handlePressClose = useLeaveRecordConfirm({
    navigation,
    hasChanges: hasWrittenAnything,
    title: '작성을 그만둘까요?',
    description: '작성한 글은 다시 되돌릴 수 없습니다.',
    confirmText: '계속 작성하기',
    onDiscard: useCallback(() => {
      resetRecordForm();
      if (isLetter) {
        resetLetterForm();
      }
    }, [isLetter, resetLetterForm, resetRecordForm]),
  });

  const { openOverlay, showToast } = useGlobalOverlay();

  /* Feed 저장 */
  const {
    createFeed,
    isCreatingFeed,
  } = useCreateFeed({
    userId,

    onSuccess: data => {
      navigation?.goBack();

      if (data?.fileUploadFailed) {
        showToast({
          message: '피드는 저장했지만 사진을 올리지 못했습니다.',
          icon: 'alert',
          iconColor: colors.fgCritical,
          bottomOffset,
        });
      }
    },

    onError: error => {
      showToast({
        message: getApiErrorMessage(error, '피드를 저장하지 못했습니다.'),
        bottomOffset,
      });
    },
  });

  const handlePressNext =
    useCallback(() => {
      /*
       * 회색 상태에서도 실제 disabled는 하지 않고,
       * 비어 있는 항목을 화면 위에서부터 순서대로 Toast로 안내합니다.
       */
      if (!isNextReady) {
        const missingToastMessage =
          (!hasRecipient && '수신인을 선택해 주세요.') ||
          (!hasDeliveryDate && '도착일을 선택해 주세요.') ||
          (!hasMusic && '음악을 선택해 주세요.') ||
          '메시지를 작성하거나 사진을 첨부해 주세요.';

        showToast({
          message: missingToastMessage,
          icon: 'alert',
          iconColor: colors.fgCritical,
          bottomOffset,
        });

        return;
      }

      /*
       * 네트워크 요청 중 연속 탭으로
       * 같은 피드가 여러 번 생성되는 것을 방지합니다.
       */
      if (isCreatingFeed) {
        return;
      }

      Keyboard.dismiss();

      /*
       * 편지는 저장 대신 봉투 선택 화면으로 이동합니다.
       */
      if (isLetter) {
        navigation?.navigate('Envelope');
        return;
      }

      createFeed();
    }, [
      bottomOffset,
      createFeed,
      hasDeliveryDate,
      hasMusic,
      hasRecipient,
      isCreatingFeed,
      isLetter,
      isNextReady,
      navigation,
      showToast,
    ]);

  /* 수신인 선택 BottomSheet 열기 */
  const handleOpenRecipientSelect = useCallback(() => {
    dismissKeyboardThen(() => {
      openOverlay({
        id: RECIPIENT_SELECT_OVERLAY_ID,
        accessibilityLabel: '수신인 선택 닫기',
        contentContainerStyle: fullScreenOverlayContainerStyle,
        renderContent: ({ close }) => (
          <RecipientSelectBottomSheet currentUserId={userId} onClose={close} />
        ),
      });
    });
  }, [openOverlay, userId]);

  /* 날짜 선택 완료 및 BottomSheet 열기 */
  const handleConfirmDate = useCallback(
    selectedDate => {
      const nextDeliveryAt = toDeliveryAt(selectedDate);
      if (!nextDeliveryAt) return;
      setDeliveryAt(nextDeliveryAt);
    },
    [setDeliveryAt],
  );

  const handleOpenDateSelect = useCallback(() => {
    dismissKeyboardThen(() => {
      openOverlay({
        id: DATE_SELECT_OVERLAY_ID,
        accessibilityLabel: '날짜 선택 닫기',
        contentContainerStyle: fullScreenOverlayContainerStyle,
        renderContent: ({ close }) => (
          <DateSelectBottomSheet
            initialDate={deliveryAtToDate(deliveryAt)}
            allowToday={canSelectToday}
            onConfirm={handleConfirmDate}
            onClose={close}
          />
        ),
      });
    });
  }, [openOverlay, deliveryAt, handleConfirmDate, canSelectToday]);

  const letterHeader = isLetter && (
    <>
      <View
        style={[
          styles.recipientAndDateContainer,
          !receiver && styles.recipientAndDateContainerBeforeSelect,
          !deliveryAt && styles.recipientAndDateContainerDateButton,
        ]}
      >
        {receiver ? (
          <Pressable
            onPress={handleOpenRecipientSelect}
            accessibilityRole="button"
            accessibilityLabel="수신인 다시 선택"
          >
            <Profile
              type="Letter"
              imageUri={receiver.profileImageUrl ? resolveMediaUri(receiver.profileImageUrl) : null}
              recipientName={`${receiver.nickname}${receiver.isMe ? '(나)' : ''}`}
              font={normalizedFont}
              style={styles.recipientProfile}
            />
          </Pressable>
        ) : (
          <LabeledButton
            icon={<IcProfile />}
            label="수신인 선택"
            typography={typo.suitLabelLargeStrong}
            color={colors.fgNeutralMuted}
            iconColor={colors.fgNeutralMuted}
            backgroundColor={colors.bgNeutralFaint}
            onPress={handleOpenRecipientSelect}
          />
        )}

        {deliveryAt ? (
          <Pressable
            style={styles.dateContainer}
            onPress={handleOpenDateSelect}
            accessibilityRole="button"
            accessibilityLabel="도착 날짜 다시 선택"
          >
            <Text style={[styles.dateText, dateTypography]}>
              {formatDeliveryDateLabel(deliveryAt)}
            </Text>
          </Pressable>
        ) : (
          <LabeledButton
            icon={<IcCalendar />}
            label="도착일 선택"
            typography={typo.suitLabelLargeStrong}
            color={colors.fgNeutralMuted}
            backgroundColor={colors.bgNeutralFaint}
            onPress={handleOpenDateSelect}
            style={styles.dateSelectButton}
          />
        )}
      </View>

      <View style={styles.dividerContainer}>
        <DividerLine />
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopIconNavigation
        type="text"
        headerText={isLetter ? '편지 작성하기' : '피드 작성하기'}
        nextText={isLetter ? '다음' : '게시'}
        onPressClose={handlePressClose}
        onPressNext={handlePressNext}
        nextTextStyle={{ color: nextTextColor }}
      />

      <RecordEditorBody
        editor={editor}
        header={letterHeader}
        placeholder={
          isLetter
            ? '음악과 함께 보낼 메시지를 작성해 주세요.'
            : '음악과 함께 기록할 내용을 작성해 주세요.'
        }
      />
    </SafeAreaView>
  );
};

export default RecordScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgLayerDefault,
  },
  recipientAndDateContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recipientAndDateContainerBeforeSelect: {
    paddingVertical: padding.S,
    paddingHorizontal: padding.L,
  },
  recipientAndDateContainerDateButton: {
    paddingRight: padding.L,
  },
  dateSelectButton: {
    alignSelf: 'center',
  },
  dateContainer: {
    paddingVertical: padding.M,
    paddingHorizontal: padding.L,
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.S,
  },
  dateText: {
    color: colors.fgNeutralSolid,
    includeFontPadding: false,
  },
  dividerContainer: {
    width: '100%',
    paddingVertical: padding.XXS,
    paddingHorizontal: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
});
