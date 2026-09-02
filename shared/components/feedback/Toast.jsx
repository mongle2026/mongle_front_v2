import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import IcFilledCheck from '../../../assets/icons/ic_filledcheck.svg';
// TODO: 느낌표 아이콘 에셋이 추가되면 ic_x를 교체해주세요.
import IcExclamation from '../../../assets/icons/ic_x.svg';

import ButtonText from '../action/ButtonText';

import { colors, shadow } from '../../styles/color';
import { padding, gap, radius } from '../../styles/token';
import { typo } from '../../styles/typo';

const TOAST_ICONS = {
  check: IcFilledCheck,
  exclamation: IcExclamation,
};

const Toast = ({
  text,
  icon = 'check',
  iconColor = colors.fgPositive,
  buttonText,
  onPressButton,
}) => {
  const Icon = TOAST_ICONS[icon] ?? TOAST_ICONS.check;

  return (
    <View style={styles.container}>
      <View style={styles.sectionToast}>
        <Icon
          width={20}
          height={20}
          color={iconColor}
        />

        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={styles.text}
        >
          {text}
        </Text>

        {buttonText && onPressButton && (
          <ButtonText
            text={buttonText}
            size="ButtonText"
            onPress={onPressButton}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: padding.M,
    paddingHorizontal: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  sectionToast: {
    alignSelf: 'stretch',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: padding.XXS,
    paddingRight: padding.L,
    paddingBottom: padding.XXS,
    paddingLeft: padding.XL,
    gap: gap.M,
    borderRadius: radius.M,
    backgroundColor: colors.bgNeutralInvertedPressed,
    ...shadow.middleDown,
  },
  text: {
    flex: 1,
    color: colors.fgNeutralInverted,
    ...typo.suitLabelLargeStrong,
  },
});

export default memo(Toast);