import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import IcImage from '../../../../assets/icons/ic_profile.svg';
import IcFont from '../../../../assets/icons/ic_musicplay.svg';
import IcArrowLeft from '../../../../assets/icons/ic_arrow_left.svg';

import IconButton from '../../../../shared/components/action/IconButton';
import Item from './Item';

import { colors } from '../../../../shared/styles/color';
import { padding } from '../../../../shared/styles/token';
import {
  FONT,
  normalizeFont,
} from '../../../../shared/styles/font';

const BottomBarActions = ({
  onPressImage,
  onPressFont,
}) => (
  <>
    <IconButton
      size="L"
      icon={
        <IcImage
          color={colors.fgNeutralMuted}
        />
      }
      onPress={onPressImage}
      accessibilityLabel="이미지 추가"
    />

    <IconButton
      size="L"
      icon={
        <IcFont
          color={colors.fgNeutralMuted}
        />
      }
      onPress={onPressFont}
      accessibilityLabel="폰트 선택"
    />
  </>
);

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
        icon={
          <IcArrowLeft
            color={colors.fgNeutralMuted}
          />
        }
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

  onPressImage,
  onPressFont,
  onPressBack,
  onSelectFont,

  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {mode === 'actions' ? (
        <BottomBarActions
          onPressImage={onPressImage}
          onPressFont={onPressFont}
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
  container: {
    width: '100%',
    paddingHorizontal: padding.XS,

    flexDirection: 'row',
    alignItems: 'center',

    borderTopWidth: 0.5,
    borderTopColor: colors.strokeNeutralSubtle,

    backgroundColor: colors.bgLayerDefault,
  },
});

export default memo(BottomBar);