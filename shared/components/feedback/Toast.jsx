import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import IcFilledCheck from '../../../assets/icons/ic_filledcheck.svg';

import ButtonText from '../action/ButtonText';

import { colors, shadow } from '../../styles/color';
import { padding, gap, radius } from '../../styles/token';

const Toast = ({
  text = '기록을 북마크에 추가했습니다.',
  buttonText = '이동',
  onPressButton,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.sectionToast}>
        <IcFilledCheck />

        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={styles.text}
        >
          {text}
        </Text>

        <ButtonText
          text={buttonText}
          onPress={onPressButton}
        />
      </View>
    </View>
  );
};

export default Toast;

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

    flexDirection: 'row',
    alignItems: 'center',

    paddingTop: padding.XS,
    paddingRight: padding.L,
    paddingBottom: padding.XS,
    paddingLeft: padding.XL,

    gap: gap.M,

    borderRadius: radius.M,
    backgroundColor: colors.bgNeutralInvertedPressed,

    ...shadow.middleDown,
  },

  text: {
    flex: 1,

    color: colors.fgNeutralInverted,

    fontFamily: 'SUIT-SemiBold',
    fontSize: 14,
    lineHeight: 17.5,

    includeFontPadding: false,
  },
});