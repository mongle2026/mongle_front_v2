import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import IcImage from '../../../../assets/icons/ic_image.svg';
import IcFont from '../../../../assets/icons/ic_font.svg';
import IcArrowLeft from '../../../../assets/icons/ic_arrow_left.svg';
import IcHideKeyboard from '../../../../assets/icons/ic_hidekeyboard.svg';

import IconButton from '../../../../shared/components/action/IconButton';
import Item from './Item';

import { colors } from '../../../../shared/styles/color';
import { padding } from '../../../../shared/styles/token';
import { FONT, normalizeFont, } from '../../../../shared/styles/fontType';

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
        <IconButton
          size="L"
          icon={IcHideKeyboard}
          color={colors.fgNeutralSecondary}
          onPress={onPressHideKeyboard}
          accessibilityLabel="키보드 숨기기"
        />
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

  return (
    <>
      <IconButton
        size="XL"
        icon={IcArrowLeft}
        color={colors.fgNeutralQuaternary}
        onPress={onPressBack}
        accessibilityLabel="폰트 선택 닫기"
      />

      <Item
        text="손글씨"
        font={FONT.KYOBO}
        selected={
          normalizedFont === FONT.KYOBO
        }
        onPress={() =>
          onSelectFont?.(FONT.KYOBO)
        }
      />

      <Item
        text="고딕체"
        font={FONT.SUIT}
        selected={
          normalizedFont === FONT.SUIT
        }
        onPress={() =>
          onSelectFont?.(FONT.SUIT)
        }
      />
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
      style={[
        styles.bar,
        mode === 'actions' && styles.barActions,
        style,
      ]}
    >
      {mode === 'actions' ? (
        <BottomBarActions
          onPressImage={onPressImage}
          onPressFont={onPressFont}
          onPressHideKeyboard={onPressHideKeyboard}
          imageDisabled={imageDisabled}
          keyboardVisible={keyboardVisible}
          showLeftActions={showLeftActions}
        />
      ) : (
        <FontSelector
          selectedFont={selectedFont}
          onPressBack={onPressBack}
          onSelectFont={onSelectFont}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    paddingHorizontal: padding.XS,

    flexDirection: 'row',
    alignItems: 'center',

    borderTopWidth: 0.5,
    borderTopColor:
      colors.strokeNeutralTertiary,

    backgroundColor:
      colors.bgSurface,
  },

  barActions: {
    justifyContent: 'space-between',
  },

  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default memo(BottomBar);