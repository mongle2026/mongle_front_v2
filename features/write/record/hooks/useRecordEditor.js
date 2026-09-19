import { useCallback } from 'react';
import { Keyboard } from 'react-native';

import { useFloatingBottomOffset } from '../../../../shared/hooks/useFloatingBottomOffset';
import { useRecordFormStore } from '../../store/useRecordFormStore';

import useRecordMusicPlayback from './useRecordMusicPlayback';
import useAutoScrollTextInput from './useAutoScrollTextInput';
import { useRecordImageManager } from './useRecordImageManager';
import { useBottomBarPanel } from './useBottomBarPanel';
import { useRecordTypography } from './useRecordTypography';
import { useMusicSelectOverlay } from './useMusicSelectOverlay';
import { useRecordTextLimit } from './useRecordTextLimit';

/*
 * RecordScreen(작성) / RecordEditScreen(수정) 공통 편집 상태.
 * 음악 · 본문 · 이미지 · 폰트 · 하단 바 · 자동 스크롤을 한 번에 묶어
 * RecordEditorBody에 그대로 넘깁니다.
 */
export default function useRecordEditor({
  navigation,
  musicSelectOverlayId,
}) {
  // 본문 글자는 RecordTextInput만 구독한다.
  // 여기서는 "글이 있는지"만 구독해서 입력할 때마다 화면 전체가 다시 그려지지 않게 한다
  const hasText = useRecordFormStore(state => state.text.trim().length > 0);
  const music = useRecordFormStore(state => state.music);

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
    handlePlayback,
  } = useRecordMusicPlayback({ music, navigation });

  const hasMusic = Boolean(music);
  const hasContent = hasText || imageFiles.length > 0;

  /* 키보드 / SafeArea 포함 BottomBar 위치 */
  const bottomOffset = useFloatingBottomOffset();

  /* 키보드 강제로 내리기 */
  const handlePressHideKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  /* 본문 2,000자 제한 (초과 시 입력 차단 + Toast) */
  const { handleChangeText } = useRecordTextLimit({ bottomOffset });

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

  /* 본문 여백을 눌러도 키보드가 뜨도록 TextInput에 포커스 */
  const handleFocusText = useCallback(() => {
    const input = textInputRef.current;
    if (!input) return;

    /* 키보드가 이미 떠 있으면 그대로 둡니다. */
    if (Keyboard.isVisible()) return;

    /*
     * keyboardDismissMode="interactive" 등으로 키보드만 내려가고
     * TextInput 포커스는 유지된 경우 focus()가 무시되므로,
     * blur 후 다음 프레임에 다시 focus 합니다.
     */
    if (input.isFocused?.()) {
      input.blur();
      requestAnimationFrame(() => textInputRef.current?.focus());
      return;
    }

    input.focus();
  }, [textInputRef]);

  /* 음악 선택 BottomSheet 열기 */
  const handleOpenMusicSelect = useMusicSelectOverlay(musicSelectOverlayId);

  return {
    music,
    hasMusic,
    hasContent,

    imageFiles,
    isImageLimitReached,
    handlePressImage,
    handleRemoveImage,

    normalizedFont,
    dateTypography,
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
  };
}
