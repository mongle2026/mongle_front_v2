import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import IcMusic from '../../../../assets/icons/ic_music.svg';

import MusicCard from '../../../../shared/components/content/MusicCard';

import { colors } from '../../../../shared/styles/color';
import { gap, padding } from '../../../../shared/styles/token';
import { typo } from '../../../../shared/styles/typo';

import LabeledButton from '../../components/LabeledButton';
import BottomBar from '../../components/bottombar/BottomBar';
import SelectedImageList from './SelectedImageList';
import { useRecordFormStore } from '../../store/useRecordFormStore';

/*
 * 본문 입력창. 글자가 바뀔 때 이 컴포넌트만 다시 그려지도록
 * 본문(text) 구독을 여기로 내렸습니다.
 */
const RecordTextInput = memo(({
  inputRef,
  font,
  placeholder,
  typography,
  minHeight,
  onChangeText,
  onContentSizeChange,
}) => {
  const text = useRecordFormStore(state => state.text);

  return (
    <TextInput
      key={font}
      ref={inputRef}
      value={text}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.fgPlaceholder}
      multiline
      scrollEnabled={false}
      textAlignVertical="top"
      onContentSizeChange={onContentSizeChange}
      style={[
        styles.textInput,
        typography,
        minHeight > 0 && { minHeight },
      ]}
    />
  );
});

/*
 * RecordScreen(작성) / RecordEditScreen(수정) 공통 본문.
 * 음악 · 본문 입력 · 이미지 목록 · 하단 바를 그립니다.
 *
 * editor: useRecordEditor 반환값
 * header: 음악 위에 들어갈 영역 (편지의 수신인 / 도착일)
 */
const RecordEditorBody = ({
  editor,
  placeholder,
  header = null,
}) => {
  const {
    music,
    imageFiles,
    isImageLimitReached,
    handlePressImage,
    handleRemoveImage,
    normalizedFont,
    bodyTypography,
    handleSelectFont,
    musicArtworkUri,
    musicPreviewUri,
    isMusicPlaying,
    handlePlayback,
    handleOpenMusicSelect,
    bottomOffset,
    handlePressHideKeyboard,
    handleChangeText,
    bottomBarHeight,
    bottomBarMode,
    handleBottomBarLayout,
    handleShowFontMode,
    handleShowActionsMode,
    scrollViewRef,
    textInputRef,
    textInputHeight,
    handleScroll,
    handleScrollViewLayout,
    handleTextContentSizeChange,
    handleFocusText,
  } = editor;

  return (
    <>
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
        {header}

        {music ? (
          <View style={styles.musicCardButton}>
            <MusicCard
              imageSource={musicArtworkUri ? { uri: musicArtworkUri } : undefined}
              title={music.musicTitle}
              artist={music.musicArtist}
              font={normalizedFont}
              isPlaying={isMusicPlaying}
              disabled={!musicPreviewUri}
              onPressPlayback={musicPreviewUri ? handlePlayback : undefined}
              onPress={handleOpenMusicSelect}
              pressAccessibilityLabel="음악 다시 선택"
            />
          </View>
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
          <Pressable
            style={[
              styles.textPressable,
              imageFiles.length === 0 && styles.textPressableFill,
            ]}
            onPress={handleFocusText}
            accessible={false}
          >
            <RecordTextInput
              inputRef={textInputRef}
              font={normalizedFont}
              placeholder={placeholder}
              typography={bodyTypography}
              minHeight={textInputHeight}
              onChangeText={handleChangeText}
              onContentSizeChange={handleTextContentSizeChange}
            />
          </Pressable>

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
          onPressHideKeyboard={handlePressHideKeyboard}
          onPressBack={handleShowActionsMode}
          onSelectFont={handleSelectFont}
        />
      </View>
    </>
  );
};

export default RecordEditorBody;

const styles = StyleSheet.create({
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
    flexGrow: 1,
    paddingVertical: padding.M,
    paddingHorizontal: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.M,
  },
  textPressable: {
    width: '100%',
    alignSelf: 'stretch',
  },
  textPressableFill: {
    flexGrow: 1,
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
