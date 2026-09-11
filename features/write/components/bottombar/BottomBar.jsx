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
import { FONT, normalizeFont, } from '../../../../shared/styles/font';

const BottomBarActions = ({
  onPressImage,
  onPressFont,
  onPressHideKeyboard,
  imageDisabled = false,
}) => {
  const imageColor = imageDisabled
    ? colors.fgDisabled
    : colors.fgNeutralMuted;

  return (
    <>
      <View style={styles.container}>
        <IconButton
          size="L"
          icon={IcImage}
          color={imageColor}
          onPress={onPressImage}
          disabled={imageDisabled}
          accessibilityLabel="이미지 추가"
          style={
            imageDisabled
              ? styles.imageButtonDisabled
              : undefined
          }
        />

        <IconButton
          size="L"
          icon={IcFont}
          color={colors.fgNeutralMuted}
          onPress={onPressFont}
          accessibilityLabel="폰트 선택"
        />
      </View>

      <IconButton
        size="L"
        icon={IcHideKeyboard}
        color={colors.fgNeutralMuted}
        onPress={onPressHideKeyboard}
        accessibilityLabel="키보드 숨기기"
      />
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
        size="L"
        icon={IcArrowLeft}
        color={colors.fgNeutralWeak}
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
      colors.strokeNeutralSubtle,

    backgroundColor:
      colors.bgLayerDefault,
  },

  barActions: {
    justifyContent: 'space-between',
  },

  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  imageButtonDisabled: {
    opacity: 1,
  },
});

export default memo(BottomBar);