import React, { useCallback, useRef, useState } from 'react';
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
import { FONT, normalizeFont } from '../../../shared/styles/font';

// Feature Components, Stores & Utils
import LabeledButton from '../components/LabeledButton';
import BottomBar from '../components/bottombar/BottomBar';
import SelectedImageList from './components/SelectedImageList';
import MusicSelectBottomSheet from '../music/components/MusicSelectBottomSheet';
import RecipientSelectBottomSheet from '../recipient/components/RecipientSelectBottomSheet';
import DateSelectBottomSheet from '../date/components/DateSelectBottomSheet';
import { useRecordFormStore } from '../store/useRecordFormStore';
import { useLetterFormStore } from '../store/useLetterFormStore';
import { deliveryAtToDate, formatDeliveryDateLabel, toDeliveryAt } from '../date/utils/deliveryDate';

// Hooks
import useRecordMusicPlayback from './hooks/useRecordMusicPlayback';
import { usePickImages } from './hooks/usePickImages';
import useCreateFeed from './hooks/useCreateFeed';

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
  const font = useRecordFormStore(state => state.font);
  const setFont = useRecordFormStore(state => state.setFont);
  const files = useRecordFormStore(state => state.files);
  const removeFile = useRecordFormStore(state => state.removeFile);
  const restoreFile = useRecordFormStore(state => state.restoreFile);

  const imageFiles = files.filter(file => file.fileType === 'IMAGE');
  const isImageLimitReached = imageFiles.length >= 2;

  /* 폰트 정규화 및 타이포 선택 */
  const normalizedFont = normalizeFont(font);
  const isSuitFont = normalizedFont === FONT.SUIT;

  const dateTypography = isSuitFont ? typo.suitLabelLarge : typo.kyoboLabelLarge;
  const bodyTypography = isSuitFont ? typo.suitBodyLarge : typo.kyoboBodyLarge;

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

  /* feed / letter 구분 */
  const type = route?.params?.type ?? RECORD_TYPE.FEED;
  const isLetter = type === RECORD_TYPE.LETTER;

  /* 다음 버튼 활성 색상 조건 */
  const hasMusic = Boolean(music);
  const hasContent = text.trim().length > 0 || imageFiles.length > 0;
  const hasRecipient = !isLetter || Boolean(receiver);
  const hasDeliveryDate = !isLetter || !receiver?.isMe || Boolean(deliveryAt);
  const isNextReady = hasMusic && hasContent && hasRecipient && hasDeliveryDate;
  const nextTextColor = isNextReady ? colors.fgNeutralMuted : colors.fgDisabled;

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
       * 회색 상태에서도 실제 disabled는 하지 않습니다.
       *
       * 추후 여기에서
       * "음악을 선택해 주세요."
       * 같은 Toast 처리를 추가할 수 있습니다.
       */
      if (!isNextReady) {
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
      createFeed,
      isCreatingFeed,
      isLetter,
      isNextReady,
    ]);

  /* 높이 측정 상태 */
  const [bottomBarHeight, setBottomBarHeight] = useState(0);
  const [textInputHeight, setTextInputHeight] = useState(0);

  /* 본문이 길어질 때 커서를 따라 스크롤하기 위한 ref */
  const scrollViewRef = useRef(null);
  const textInputRef = useRef(null);
  const scrollOffsetRef = useRef(0);
  const scrollViewportHeightRef = useRef(0);

  const handleScroll = useCallback(event => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const handleScrollViewLayout = useCallback(event => {
    scrollViewportHeightRef.current = event.nativeEvent.layout.height;
  }, []);

  /*
   * TextInput 아래쪽 끝이 현재 보이는 영역을 벗어난 경우에만,
   * 그 끝이 딱 보이는 위치까지만 스크롤합니다. scrollToEnd를 쓰면
   * 아래에 붙어 있는 사진 목록까지 같이 내려가버리므로,
   * TextInput의 실제 위치를 측정해 그 범위 안에서만 스크롤합니다.
   */
  const scrollToKeepTextInputVisible = useCallback(() => {
    const textInputNode = textInputRef.current;
    const scrollNode = scrollViewRef.current;
    if (!textInputNode || !scrollNode) return;

    textInputNode.measureLayout(
      scrollNode,
      (x, y, width, height) => {
        const frameHeight = scrollViewportHeightRef.current;
        if (!frameHeight) return;

        /*
         * ScrollView 프레임 자체는 키보드가 올라와도 줄어들지 않고,
         * 떠 있는 BottomBar(bottomBarHeight)가 키보드 바로 위(bottomOffset)에
         * 겹쳐 화면 아래쪽을 가립니다. 실제로 사용자 눈에 보이는 높이는
         * 그만큼을 뺀 값입니다.
         */
        const visibleViewportHeight = Math.max(0, frameHeight - bottomBarHeight - bottomOffset);

        const bottomEdge = y + height;
        const visibleBottom = scrollOffsetRef.current + visibleViewportHeight;

        if (bottomEdge > visibleBottom) {
          scrollNode.scrollTo({ y: bottomEdge - visibleViewportHeight, animated: true });
        }
      },
      () => {},
    );
  }, [bottomBarHeight, bottomOffset]);

  /*
   * 커서가 있는 마지막 줄이 measuredHeight 딱 그 경계에
   * 걸쳐 있으면, 네이티브 쪽 relayout이 한 프레임 늦게
   * 반영되는 순간 커서가 렌더링된 영역 밖으로 벗어나
   * Android가 스크롤을 튕겼다가 되돌리는 현상이 생깁니다.
   * 항상 한 줄만큼 여유 공간을 남겨 커서가 경계에 걸치는
   * 상황 자체를 없앱니다.
   */
  const handleTextContentSizeChange = useCallback(event => {
    const measuredHeight = Math.ceil(event.nativeEvent.contentSize.height);
    const nextHeight = measuredHeight + bodyTypography.lineHeight;

    setTextInputHeight(prevHeight => {
      if (Math.abs(prevHeight - nextHeight) < 1) return prevHeight;

      /*
       * 본문이 길어져 입력창이 커지는 경우에만 스크롤을 아래로
       * 따라가게 합니다. 레이아웃 반영 이후에 스크롤해야
       * 새로 늘어난 영역까지 정확히 내려가므로 한 프레임 뒤로 미룹니다.
       */
      if (nextHeight > prevHeight) {
        requestAnimationFrame(scrollToKeepTextInputVisible);
      }

      return nextHeight;
    });
  }, [bodyTypography.lineHeight, scrollToKeepTextInputVisible]);

  const handleBottomBarLayout = useCallback(event => {
    setBottomBarHeight(event.nativeEvent.layout.height);
  }, []);

  /* 수신인 선택 BottomSheet 열기 */
  const handleOpenRecipientSelect = useCallback(() => {
    Keyboard.dismiss();

    openOverlay({
      id: RECIPIENT_SELECT_OVERLAY_ID,
      accessibilityLabel: '수신인 선택 닫기',
      contentContainerStyle: styles.bottomSheetOverlayContainer,
      renderContent: ({ close }) => (
        <RecipientSelectBottomSheet currentUserId={userId} onClose={close} />
      ),
    });
  }, [openOverlay, userId]);

  /* 음악 선택 BottomSheet 열기 */
  const handleOpenMusicSelect = useCallback(() => {
    Keyboard.dismiss();

    openOverlay({
      id: MUSIC_SELECT_OVERLAY_ID,
      accessibilityLabel: '음악 선택 닫기',
      contentContainerStyle: styles.bottomSheetOverlayContainer,
      renderContent: ({ close }) => <MusicSelectBottomSheet onClose={close} />,
    });
  }, [openOverlay]);

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
      contentContainerStyle: styles.bottomSheetOverlayContainer,
      renderContent: ({ close }) => (
        <DateSelectBottomSheet
          initialDate={deliveryAtToDate(deliveryAt)}
          onConfirm={handleConfirmDate}
          onClose={close}
        />
      ),
    });
  }, [openOverlay, deliveryAt, handleConfirmDate]);

  /* 하단 바 */
  const [bottomBarMode, setBottomBarMode] = useState('actions');

  const handleSelectFont = useCallback(
    nextFont => {
      const normalized = normalizeFont(nextFont);
      setFont(normalized === FONT.SUIT ? 'SUIT' : 'KYOBO');
    },
    [setFont],
  );

  /* 이미지 선택, 삭제 및 되돌리기 */
  const pickImages = usePickImages();

  const handlePressImage = useCallback(() => {
    Keyboard.dismiss();
    pickImages();
  }, [pickImages]);

  const handleRemoveImage = useCallback(
    image => {
      if (!image?.uri) return;

      const fileIndex = files.findIndex(file => file.uri === image.uri);
      if (fileIndex < 0) return;

      removeFile(image.uri);

      showToast({
        message: '사진을 삭제했습니다.',
        buttonText: '되돌리기',
        onPressButton: () => restoreFile(image, fileIndex),
        bottomOffset,
      });
    },
    [bottomOffset, files, removeFile, restoreFile, showToast],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopIconNavigation
        type="text"
        headerText={isLetter ? '편지 작성하기' : '피드 작성하기'}
        onPressClose={() => navigation?.goBack()}
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
                receiver?.isMe && !deliveryAt && styles.recipientAndDateContainerDateButton,
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

              {receiver?.isMe && (
                deliveryAt ? (
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
                    label="날짜 선택"
                    typography={typo.suitLabelLargeStrong}
                    color={colors.fgNeutralMuted}
                    backgroundColor={colors.bgNeutralFaint}
                    onPress={handleOpenDateSelect}
                    style={styles.dateSelectButton}
                  />
                )
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
            ref={textInputRef}
            value={text}
            onChangeText={setText}
            placeholder="텍스트 입력"
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
          onPressFont={() => setBottomBarMode('font')}
          onPressBack={() => setBottomBarMode('actions')}
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
    textAlign: 'justify',
    includeFontPadding: false,
  },
  bottomBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  bottomSheetOverlayContainer: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
  },
});