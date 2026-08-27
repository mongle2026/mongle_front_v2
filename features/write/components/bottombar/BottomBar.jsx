import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import IcImage from '../../../../assets/icons/ic_profile.svg';
import IcFont from '../../../../assets/icons/ic_musicplay.svg';

import IconButton from '../../../../shared/components/action/IconButton';

import { colors } from '../../../../shared/styles/color';
import { padding } from '../../../../shared/styles/token';

const BottomBar = ({
  state = 'default',
  onPressImage,
  onPressFont,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
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