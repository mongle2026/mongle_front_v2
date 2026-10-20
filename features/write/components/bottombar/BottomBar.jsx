import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  FadeOutLeft,
  FadeOutRight,
  LayoutAnimationConfig,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import IcImage from '../../../../assets/icons/ic_image.svg';
import IcFont from '../../../../assets/icons/ic_font.svg';
import IcArrowLeft from '../../../../assets/icons/ic_arrow_left.svg';
import IcHideKeyboard from '../../../../assets/icons/ic_hidekeyboard.svg';

import IconButton from '../../../../shared/components/action/IconButton';
import Item from './Item';

import { colors } from '../../../../shared/styles/color';
import { padding } from '../../../../shared/styles/token';
import { FONT, normalizeFont, } from '../../../../shared/styles/fontType';

// Figma BottomBar/BottomBar: type=default · type=menu 모두 높이 38 (IconButton XL 기준).
// 두 모드 높이를 같게 고정해 전환할 때 바와 그 위 내용이 들썩이지 않게 한다
const BAR_HEIGHT = 38;

// 모드 전환: 폰트 선택은 오른쪽에서, 기본 아이콘은 왼쪽에서 살짝 밀려 들어온다
const MODE_ENTER_DURATION = 220;
const MODE_EXIT_DURATION = 140;

const FONT_MODE_ENTERING = FadeInRight.duration(MODE_ENTER_DURATION).easing(Easing.out(Easing.cubic));
const FONT_MODE_EXITING = FadeOutRight.duration(MODE_EXIT_DURATION);
const ACTIONS_MODE_ENTERING = FadeInLeft.duration(MODE_ENTER_DURATION).easing(Easing.out(Easing.cubic));
const ACTIONS_MODE_EXITING = FadeOutLeft.duration(MODE_EXIT_DURATION);

// 키보드 숨기기 버튼은 키보드가 오르내릴 때 툭 나타나지 않게 페이드
const HIDE_KEYBOARD_ENTERING = FadeIn.duration(150);
const HIDE_KEYBOARD_EXITING = FadeOut.duration(120);

const FONT_OPTIONS = [
  { font: FONT.KYOBO, text: '손글씨' },
  { font: FONT.SUIT, text: '고딕체' },
];

const playSelectionHaptic = () => {
  void Haptics.selectionAsync().catch(() => {
    /* 햅틱을 지원하지 않는 환경에서도 폰트 선택은 그대로 동작한다 */
  });
};

const BottomBarActions = ({
  onPressImage,
  onPressFont,
  onPressHideKeyboard,
  imageDisabled = false,
  keyboardVisible = false,
  showLeftActions = true,
}) => {
  return (
    <>
      {/* 왼쪽 아이콘을 숨겨도 빈 자리를 남겨서 키보드 숨기기 버튼이 오른쪽에 붙게 한다 */}
      <View style={styles.container}>
        {showLeftActions && (
          <>
            <IconButton
              size="XL"
              icon={IcImage}
              color={colors.fgNeutralSecondary}
              onPress={onPressImage}
              disabled={imageDisabled}
              accessibilityLabel="이미지 추가"
            />

            <IconButton
              size="XL"
              icon={IcFont}
              color={colors.fgNeutralSecondary}
              onPress={onPressFont}
              accessibilityLabel="폰트 선택"
            />
          </>
        )}
      </View>

      {keyboardVisible && (
        <Animated.View
          entering={HIDE_KEYBOARD_ENTERING}
          exiting={HIDE_KEYBOARD_EXITING}
        >
          <IconButton
            size="L"
            icon={IcHideKeyboard}
            color={colors.fgNeutralPrimary}
            onPress={onPressHideKeyboard}
            accessibilityLabel="키보드 숨기기"
          />
        </Animated.View>
      )}
    </>
  );
};

const FontSelector = ({
  selectedFont,
  onPressBack,
  onSelectFont,
}) => {
  const normalizedFont =
    normalizeFont(selectedFont);

  const handleSelectFont = useCallback(
    font => {
      if (font !== normalizedFont) playSelectionHaptic();
      onSelectFont?.(font);
    },
    [normalizedFont, onSelectFont],
  );

  return (
    <>
      <IconButton
        size="XL"
        icon={IcArrowLeft}
        color={colors.fgNeutralQuaternary}
        onPress={onPressBack}
        accessibilityLabel="폰트 선택 닫기"
      />

      {FONT_OPTIONS.map(option => (
        <Item
          key={option.font}
          text={option.text}
          font={option.font}
          selected={normalizedFont === option.font}
          onPress={() => handleSelectFont(option.font)}
        />
      ))}
    </>
  );
};

const BottomBar = ({
  mode = 'actions',

  selectedFont,

  imageDisabled = false,
  keyboardVisible = false,
  // false면 왼쪽 이미지 · 폰트 아이콘을 숨긴다 (mode = actions)
  showLeftActions = true,

  onPressImage,
  onPressFont,
  onPressHideKeyboard,
  onPressBack,
  onSelectFont,

  style,
}) => {
  return (
    <View
      style={[styles.bar, style]}
    >
      {/* 화면이 처음 열릴 때는 그냥 보이고, Tt · 뒤로가기로 모드를 바꿀 때만 전환 애니메이션을 준다 */}
      <LayoutAnimationConfig skipEntering>
        {mode === 'actions' ? (
          <Animated.View
            key="actions"
            style={[styles.mode, styles.modeActions]}
            entering={ACTIONS_MODE_ENTERING}
            exiting={ACTIONS_MODE_EXITING}
          >
            <BottomBarActions
              onPressImage={onPressImage}
              onPressFont={onPressFont}
              onPressHideKeyboard={onPressHideKeyboard}
              imageDisabled={imageDisabled}
              keyboardVisible={keyboardVisible}
              showLeftActions={showLeftActions}
            />
          </Animated.View>
        ) : (
          <Animated.View
            key="font"
            style={styles.mode}
            entering={FONT_MODE_ENTERING}
            exiting={FONT_MODE_EXITING}
          >
            <FontSelector
              selectedFont={selectedFont}
              onPressBack={onPressBack}
              onSelectFont={onSelectFont}
            />
          </Animated.View>
        )}
      </LayoutAnimationConfig>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    minHeight: BAR_HEIGHT,
    paddingHorizontal: padding.XS,
    overflow: 'hidden',

    flexDirection: 'row',
    alignItems: 'center',

    borderTopWidth: 0.5,
    borderTopColor:
      colors.strokeNeutralTertiary,

    backgroundColor:
      colors.bgSurface,
  },

  // 두 모드가 같은 자리에 겹쳐 전환되도록 바 안을 꽉 채운다
  mode: {
    flex: 1,
    minHeight: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },

  modeActions: {
    justifyContent: 'space-between',
  },


  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default memo(BottomBar);