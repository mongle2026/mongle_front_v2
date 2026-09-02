import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Icons
import IcMusic from '../../../assets/icons/ic_musicplay.svg';

// Shared Components & Providers
import MusicCard from '../../../shared/components/content/MusicCard';
import TopIconNavigation from '../../../shared/components/navigation/topnavigation/TopIconNavigation';
import { useGlobalOverlay } from '../../../shared/providers/GlobalOverlayProvider';

// Shared Hooks & Utils
import { useFloatingBottomOffset } from '../../../shared/hooks/useFloatingBottomOffset';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';

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
import { useRecordFormStore } from '../store/useRecordFormStore';

// Hooks
import useRecordMusicPlayback from './hooks/useRecordMusicPlayback';
import { usePickImages } from './hooks/usePickImages';
import { useFeedEditForm } from './hooks/useFeedEditForm';
import useUpdateFeed from './hooks/useUpdateFeed';

const MUSIC_SELECT_OVERLAY_ID = 'record-edit-music-select';

const RecordEditScreen = ({ navigation, route }) => {
  /* 현재 로그인 사용자 */
  const { userId } = useCurrentUser();

  const feedId = route?.params?.feedId;

  /* 수정 대상 피드를 store로 불러오기 */
  const {
    loading: isLoadingFeed,
    error: loadFeedError,
    originalFileIds,
  } = useFeedEditForm({ feedId, userId });

  /* 피드 작성 데이터 (RecordScreen과 store를 공유) */
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

  /* 다음 버튼 활성 색상 조건 */
  const hasMusic = Boolean(music);
  const hasContent = text.trim().length > 0 || imageFiles.length > 0;
  const isNextReady = hasMusic && hasContent;
  const nextTextColor = isNextReady ? colors.fgNeutralMuted : colors.fgDisabled;

  /* 키보드 / SafeArea 포함 BottomBar 위치 */
  const bottomOffset = useFloatingBottomOffset();
  const { openOverlay, showToast } = useGlobalOverlay();

  /* Feed 수정 저장 */
  const {
    updateFeed,
    isUpdatingFeed,
  } = useUpdateFeed({
    feedId,
    userId,
    originalFileIds,

    onSuccess: () => {
      navigation?.goBack();
    },

    onError: error => {
      const message =
        error.response?.data?.message ??
        '피드를 수정하지 못했습니다.';

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
      if (!isNextReady) {
        return;
      }

      /*
       * 네트워크 요청 중 연속 탭으로
       * 같은 피드가 여러 번 수정되는 것을 방지합니다.
       */
      if (isUpdatingFeed) {
        return;
      }

      Keyboard.dismiss();

      updateFeed();
    }, [
      isNextReady,
      isUpdatingFeed,
      updateFeed,
    ]);

  /* 높이 측정 상태 */
  const [bottomBarHeight, setBottomBarHeight] = useState(0);
  const [textInputHeight, setTextInputHeight] = useState(0);

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
      return nextHeight;
    });
  }, [bodyTypography.lineHeight]);

  const handleBottomBarLayout = useCallback(event => {
    setBottomBarHeight(event.nativeEvent.layout.height);
  }, []);

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

  if (isLoadingFeed || loadFeedError) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <TopIconNavigation
          type="text"
          headerText="피드 수정하기"
          onPressClose={() => navigation?.goBack()}
          nextTextStyle={{ color: colors.fgDisabled }}
        />

        <View style={styles.stateContainer}>
          {isLoadingFeed && <ActivityIndicator />}

          {!isLoadingFeed && loadFeedError && (
            <Text allowFontScaling={false} style={styles.stateText}>
              기록을 불러오지 못했습니다.
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopIconNavigation
        type="text"
        headerText="피드 수정하기"
        onPressClose={() => navigation?.goBack()}
        onPressNext={handlePressNext}
        nextTextStyle={{ color: nextTextColor }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomBarHeight + bottomOffset },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
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

export default RecordEditScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgLayerDefault,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    color: colors.fgNeutralMuted,
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
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
  },
});
