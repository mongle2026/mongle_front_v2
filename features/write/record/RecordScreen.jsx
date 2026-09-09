import React, { useCallback, useEffect } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Icons
import IcProfile from '../../../assets/icons/ic_profile.svg';
import IcMusic from '../../../assets/icons/ic_music.svg';
import IcCalendar from '../../../assets/icons/ic_calendar.svg';

// Shared Components & Providers
import { DividerLine } from '../../../shared/components/atomic/DividerLine';
import MusicCard from '../../../shared/components/content/MusicCard';
import Profile from '../../../shared/components/content/profile/Profile';
import TopIconNavigation from '../../../shared/components/navigation/topnavigation/TopIconNavigation';
import { useGlobalOverlay } from '../../../shared/providers/GlobalOverlayProvider';

// Shared Hooks & Utils
import { useFloatingBottomOffset } from '../../../shared/hooks/useFloatingBottomOffset';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import { resolveMediaUri } from '../../../shared/utils/media';

// Shared Styles
import { colors } from '../../../shared/styles/color';
import { gap, padding } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';

// Feature Components, Stores & Utils
import LabeledButton from '../components/LabeledButton';
import BottomBar from '../components/bottombar/BottomBar';
import SelectedImageList from './components/SelectedImageList';
import RecipientSelectBottomSheet from '../recipient/components/RecipientSelectBottomSheet';
import DateSelectBottomSheet from '../date/components/DateSelectBottomSheet';
import { useRecordFormStore } from '../store/useRecordFormStore';
import { useLetterFormStore } from '../store/useLetterFormStore';
import { useFeedFormStore } from '../store/useFeedFormStore';
import { deliveryAtToDate, formatDeliveryDateLabel, toDeliveryAt } from '../date/utils/deliveryDate';
import { fullScreenOverlayContainerStyle } from '../utils/overlayContainerStyle';

// Hooks
import useRecordMusicPlayback from './hooks/useRecordMusicPlayback';
import useCreateFeed from './hooks/useCreateFeed';
import useAutoScrollTextInput from './hooks/useAutoScrollTextInput';
import { useLeaveRecordConfirm } from './hooks/useLeaveRecordConfirm';
import { useRecordImageManager } from './hooks/useRecordImageManager';
import { useBottomBarPanel } from './hooks/useBottomBarPanel';
import { useRecordTypography } from './hooks/useRecordTypography';
import { useMusicSelectOverlay } from './hooks/useMusicSelectOverlay';

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

  /* 피드 / 편지 공통 작성 데이터 */
  const text = useRecordFormStore(state => state.text);
  const setText = useRecordFormStore(state => state.setText);
  const music = useRecordFormStore(state => state.music);
  const resetRecordForm = useRecordFormStore(state => state.resetRecordForm);
  const resetFeedForm = useFeedFormStore(state => state.resetFeedForm);

  /* 이미지 선택, 삭제 및 되돌리기 */
  const {
    imageFiles,
    isImageLimitReached,
    handlePressImage,
    handleRemoveImage,
  } = useRecordImageManager();

  /* 폰트 정규화 및 타이포 선택 */
  const {
    normalizedFont,
    dateTypography,
    bodyTypography,
    handleSelectFont,
  } = useRecordTypography();

  /* 음악 재생 */
  const {
    musicArtworkUri,
    musicPreviewUri,
    isMusicPlaying,
    playbackProgress,
    handlePlayback,
    handleSeek,
  } = useRecordMusicPlayback({ music, navigation });

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
  const hasMusic = Boolean(music);
  const hasContent = text.trim().length > 0 || imageFiles.length > 0;
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
      resetFeedForm();
      if (isLetter) {
        resetLetterForm();
      }
    }, [isLetter, resetFeedForm, resetLetterForm, resetRecordForm]),
  });

  /* 키보드 / SafeArea 포함 BottomBar 위치 */
  const bottomOffset = useFloatingBottomOffset();
  const { openOverlay, showToast } = useGlobalOverlay();

  /* Feed 저장 */
  const {
    createFeed,
    isCreatingFeed,
  } = useCreateFeed({
    userId,

    onSuccess: () => {
      navigation?.goBack();
    },

    onError: error => {
      const message =
        error.response?.data?.message ??
        '피드를 저장하지 못했습니다.';

      showToast({
        message:
          Array.isArray(message)
            ? message[0]
            : message,

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

      /*
       * 이번 작업에서는 피드 저장만 연결합니다.
       * 편지의 다음 단계는 이후 여기에서 분기하면 됩니다.
       */
      if (isLetter) {
        return;
      }

      Keyboard.dismiss();

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
      showToast,
    ]);

  /* 하단 바 높이 측정 및 actions / font 모드 전환 */
  const {
    bottomBarHeight,
    bottomBarMode,
    handleBottomBarLayout,
    handleShowFontMode,
    handleShowActionsMode,
  } = useBottomBarPanel();

  /* 본문이 길어질 때 커서를 따라 스크롤 */
  const {
    scrollViewRef,
    textInputRef,
    textInputHeight,
    handleScroll,
    handleScrollViewLayout,
    handleTextContentSizeChange,
  } = useAutoScrollTextInput({
    bottomBarHeight,
    bottomOffset,
    lineHeight: bodyTypography.lineHeight,
  });

  /* 수신인 선택 BottomSheet 열기 */
  const handleOpenRecipientSelect = useCallback(() => {
    Keyboard.dismiss();

    openOverlay({
      id: RECIPIENT_SELECT_OVERLAY_ID,
      accessibilityLabel: '수신인 선택 닫기',
      contentContainerStyle: fullScreenOverlayContainerStyle,
      renderContent: ({ close }) => (
        <RecipientSelectBottomSheet currentUserId={userId} onClose={close} />
      ),
    });
  }, [openOverlay, userId]);

  /* 음악 선택 BottomSheet 열기 */
  const handleOpenMusicSelect = useMusicSelectOverlay(MUSIC_SELECT_OVERLAY_ID);

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
    Keyboard.dismiss();

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
  }, [openOverlay, deliveryAt, handleConfirmDate, canSelectToday]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopIconNavigation
        type="text"
        headerText={isLetter ? '편지 작성하기' : '피드 작성하기'}
        onPressClose={handlePressClose}
        onPressNext={handlePressNext}
        nextTextStyle={{ color: nextTextColor }}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomBarHeight + bottomOffset },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onLayout={handleScrollViewLayout}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {isLetter && (
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
                  <Text allowFontScaling={false} style={[styles.dateText, dateTypography]}>
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
        )}

        {music ? (
          <Pressable
            style={styles.musicCardButton}
            onPress={handleOpenMusicSelect}
            accessibilityRole="button"
            accessibilityLabel="음악 다시 선택"
          >
            <MusicCard
              imageSource={musicArtworkUri ? { uri: musicArtworkUri } : undefined}
              title={music.musicTitle}
              artist={music.musicArtist}
              font={normalizedFont}
              isPlaying={isMusicPlaying}
              playbackProgress={playbackProgress}
              disabled={!musicPreviewUri}
              onPressPlayback={musicPreviewUri ? handlePlayback : undefined}
              onSeekPlayback={musicPreviewUri ? handleSeek : undefined}
            />
          </Pressable>
        ) : (
          <View style={styles.musicContainer}>
            <LabeledButton
              icon={<IcMusic />}
              label="음악 선택"
              typography={typo.suitLabelLargeStrong}
              color={colors.fgNeutralMuted}
              iconColor={colors.fgNeutralMuted}
              backgroundColor={colors.bgNeutralFaint}
              onPress={handleOpenMusicSelect}
            />
          </View>
        )}

        <View style={styles.textContainer}>
          <TextInput
            key={normalizedFont}
            ref={textInputRef}
            value={text}
            onChangeText={setText}
            placeholder={
              isLetter
                ? '음악과 함께 보낼 메시지를 작성해 주세요.'
                : '음악과 함께 기록할 내용을 작성해 주세요.'
            }
            placeholderTextColor={colors.fgPlaceholder}
            multiline
            scrollEnabled={false}
            textAlignVertical="top"
            allowFontScaling={false}
            onContentSizeChange={handleTextContentSizeChange}
            style={[
              styles.textInput,
              bodyTypography,
              textInputHeight > 0 && { minHeight: textInputHeight },
            ]}
          />

          <SelectedImageList
            images={imageFiles}
            onRemove={handleRemoveImage}
          />
        </View>
      </ScrollView>

      <View
        style={[styles.bottomBarContainer, { bottom: bottomOffset }]}
        onLayout={handleBottomBarLayout}
      >
        <BottomBar
          mode={bottomBarMode}
          selectedFont={normalizedFont}
          imageDisabled={isImageLimitReached}
          onPressImage={handlePressImage}
          onPressFont={handleShowFontMode}
          onPressBack={handleShowActionsMode}
          onSelectFont={handleSelectFont}
        />
      </View>
    </SafeAreaView>
  );
};

export default RecordScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgLayerDefault,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    flexGrow: 1,
    alignItems: 'flex-start',
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
  musicCardButton: {
    width: '100%',
  },
  musicContainer: {
    width: '100%',
    paddingVertical: padding.S,
    paddingHorizontal: padding.L,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    width: '100%',
    alignSelf: 'stretch',
    paddingVertical: padding.M,
    paddingHorizontal: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.M,
  },
  textInput: {
    width: '100%',
    alignSelf: 'stretch',
    padding: 0,
    margin: 0,
    color: colors.fgNeutralSolid,
    textAlign: 'left',
    includeFontPadding: false,
  },
  bottomBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
});