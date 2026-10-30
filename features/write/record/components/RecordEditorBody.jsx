import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import IcMusic from '../../../../assets/icons/ic_music.svg';

import MusicCard from '../../../../shared/components/content/MusicCard';

import { colors } from '../../../../shared/styles/color';
import { gap, padding } from '../../../../shared/styles/token';
import { typo } from '../../../../shared/styles/typo';

import LabeledButton from '../../components/LabeledButton';
import BottomBar from '../../components/bottombar/BottomBar';
import KeyboardGapFill from '../../../../shared/components/layout/KeyboardGapFill';
import SelectedImageList from './SelectedImageList';
import { useRecordFormStore } from '../../store/useRecordFormStore';
import { toImageSource } from '../../../../shared/utils/media';

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

  /*
   * iOS 에서 폰트가 바뀌지 않는 문제 때문에 폰트가 바뀌면 TextInput 을 새로 만든다(key={renderedFont}).
   * 입력 중에 그대로 바꾸면 이전 입력창이 사라지는 순간 포커스가 비어 키보드가 내려갔다 올라오므로,
   * 바꾸기 전에 숨은 입력창(keyboardKeeper)에 포커스를 잠깐 맡겨 키보드를 붙잡아 두고,
   * 새 입력창이 생기면 포커스와 커서 위치를 이어 준다. 글자는 살짝 페이드인한다.
   */
  const isFocusedRef = useRef(false);
  const selectionRef = useRef(null);
  const keyboardKeeperRef = useRef(null);
  const shouldRestoreFocusRef = useRef(false);
  const [renderedFont, setRenderedFont] = useState(font);
  const prevRenderedFontRef = useRef(renderedFont);
  const fontFade = useSharedValue(1);

  useEffect(() => {
    if (renderedFont === font) return;

    if (!isFocusedRef.current) {
      setRenderedFont(font);
      return;
    }

    // 숨은 입력창이 포커스를 받은 뒤(onFocus)에 입력창을 바꾼다
    shouldRestoreFocusRef.current = true;
    keyboardKeeperRef.current?.focus();
  }, [font, renderedFont]);

  const handleKeyboardKeeperFocus = useCallback(() => {
    setRenderedFont(font);
  }, [font]);

  useEffect(() => {
    if (prevRenderedFontRef.current === renderedFont) return;
    prevRenderedFontRef.current = renderedFont;

    fontFade.value = 0.2;
    fontFade.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });

    if (!shouldRestoreFocusRef.current) return;
    shouldRestoreFocusRef.current = false;

    const input = inputRef?.current;
    input?.focus();

    const selection = selectionRef.current;
    if (selection && typeof input?.setSelection === 'function') {
      input.setSelection(selection.start, selection.end);
    }
  }, [renderedFont, inputRef, fontFade]);

  const fontFadeStyle = useAnimatedStyle(() => ({
    opacity: fontFade.value,
  }));

  return (
    <Animated.View style={[styles.textInputFade, fontFadeStyle]}>
      <TextInput
        ref={keyboardKeeperRef}
        onFocus={handleKeyboardKeeperFocus}
        caretHidden
        pointerEvents="none"
        accessible={false}
        importantForAccessibility="no"
        accessibilityElementsHidden
        style={styles.keyboardKeeper}
      />

      <TextInput
        key={renderedFont}
        ref={inputRef}
        value={text}
        onFocus={() => {
          isFocusedRef.current = true;
        }}
        onBlur={() => {
          // 폰트 변경으로 숨은 입력창에 포커스를 맡길 때도 blur 가 오지만, 새 입력창이 다시 이어받는다
          isFocusedRef.current = Boolean(inputRef?.current?.isFocused?.());
        }}
        onSelectionChange={event => {
          selectionRef.current = event.nativeEvent.selection;
        }}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.fgNeutralTertiary}
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
    </Animated.View>
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
    keyboardHeight,
    isKeyboardVisible,
    bottomBarBottom,
    bottomBarPadding,
    bottomBarAnimatedStyle,
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
          /* bottomBarHeight 에 SafeArea 여백이 이미 포함돼 있습니다. */
          { paddingBottom: bottomBarHeight + bottomBarBottom },
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
              imageSource={toImageSource(musicArtworkUri)}
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
              color={colors.fgNeutralSecondary}
              iconColor={colors.fgNeutralSecondary}
              backgroundColor={colors.fillNeutralWeak}
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

      <Animated.View
        style={[
          styles.bottomBarContainer,
          { paddingBottom: bottomBarPadding },
          bottomBarAnimatedStyle,
        ]}
        onLayout={handleBottomBarLayout}
      >
        <BottomBar
          mode={bottomBarMode}
          selectedFont={normalizedFont}
          imageDisabled={isImageLimitReached}
          keyboardVisible={isKeyboardVisible}
          onPressImage={handlePressImage}
          onPressFont={handleShowFontMode}
          onPressHideKeyboard={handlePressHideKeyboard}
          onPressBack={handleShowActionsMode}
          onSelectFont={handleSelectFont}
        />

        {/* iOS 키보드 둥근 모서리 틈으로 뒤 화면이 비치지 않게 바 배경을 키보드 뒤까지 늘린다 */}
        <KeyboardGapFill height={keyboardHeight} />
      </Animated.View>
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
  textInputFade: {
    width: '100%',
    alignSelf: 'stretch',
  },
  keyboardKeeper: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  textInput: {
    width: '100%',
    alignSelf: 'stretch',
    padding: 0,
    margin: 0,
    color: colors.fgNeutralPrimary,
    textAlign: 'left',
    includeFontPadding: false,
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: colors.bgSurface,
  },
});
