import React, { useCallback } from 'react';
import { ActivityIndicator, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Icons
import IcMusic from '../../../assets/icons/ic_music.svg';

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

// Feature Components, Stores & Utils
import LabeledButton from '../components/LabeledButton';
import BottomBar from '../components/bottombar/BottomBar';
import SelectedImageList from './components/SelectedImageList';
import { useRecordFormStore } from '../store/useRecordFormStore';
import { useFeedFormStore } from '../store/useFeedFormStore';

// Hooks
import useRecordMusicPlayback from './hooks/useRecordMusicPlayback';
import { useFeedEditForm } from './hooks/useFeedEditForm';
import useUpdateFeed from './hooks/useUpdateFeed';
import useAutoScrollTextInput from './hooks/useAutoScrollTextInput';
import { useLeaveRecordConfirm } from './hooks/useLeaveRecordConfirm';
import { useRecordImageManager } from './hooks/useRecordImageManager';
import { useBottomBarPanel } from './hooks/useBottomBarPanel';
import { useRecordTypography } from './hooks/useRecordTypography';
import { useMusicSelectOverlay } from './hooks/useMusicSelectOverlay';

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
  const isDirty = useRecordFormStore(state => state.isDirty);
  const resetRecordForm = useRecordFormStore(state => state.resetRecordForm);
  const resetFeedForm = useFeedFormStore(state => state.resetFeedForm);

  const handlePressClose = useLeaveRecordConfirm({
    navigation,
    hasChanges: isDirty,
    title: '수정을 그만둘까요?',
    description: '수정된 내용은 저장되지 않습니다.',
    confirmText: '계속 수정하기',
    onDiscard: useCallback(() => {
      resetRecordForm();
      resetFeedForm();
    }, [resetFeedForm, resetRecordForm]),
  });

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

  /* 다음 버튼 활성 색상 조건 */
  const hasMusic = Boolean(music);
  const hasContent = text.trim().length > 0 || imageFiles.length > 0;
  const isNextReady = hasMusic && hasContent;
  const nextTextColor = isNextReady ? colors.fgNeutralMuted : colors.fgDisabled;

  /* 키보드 / SafeArea 포함 BottomBar 위치 */
  const bottomOffset = useFloatingBottomOffset();
  const { showToast } = useGlobalOverlay();

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

  /* 음악 선택 BottomSheet 열기 */
  const handleOpenMusicSelect = useMusicSelectOverlay(MUSIC_SELECT_OVERLAY_ID);

  if (isLoadingFeed || loadFeedError) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <TopIconNavigation
          type="text"
          headerText="피드 수정하기"
          onPressClose={handlePressClose}
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
          onPressFont={handleShowFontMode}
          onPressBack={handleShowActionsMode}
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
