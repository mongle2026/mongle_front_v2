import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import IcFilledCheck from '../../../assets/icons/ic_filledcheck.svg';

import ButtonText from '../action/ButtonText';

import { colors, shadow } from '../../styles/color';
import { padding, gap, radius } from '../../styles/token';
import { typo } from '../../styles/typo';

const Toast = ({
  text,
  buttonText,
  onPressButton,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.sectionToast}>
        <IcFilledCheck
          width={20}
          height={20}
          color={colors.fgPositive}
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
    minHeight: 47,
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