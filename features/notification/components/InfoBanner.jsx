import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import IcFilledAlert from '../../../assets/icons/ic_filledalert.svg';

import { colors } from '../../../shared/styles/color';
import { padding, gap } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';

const InfoBanner = () => {
  return (
    <View style={styles.container}>
      <IcFilledAlert
        width={16}
        height={16}
        color={colors.fgNeutralSubtle}
        style={styles.icon}
      />

      <Text style={styles.text}>
        최근 30일 동안의 알림만 확인할 수 있어요.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: padding.L,
    gap: gap.S,
    backgroundColor: colors.bgLayerBasement,
  },
  icon: {
    flexShrink: 0,
  },
  text: {
    color: colors.fgNeutralSubtle,
    textAlign: 'center',
    ...typo.suitLabelMedium,
  },
});

export default memo(InfoBanner);
