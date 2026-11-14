import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import IcFilledAlert from '../../../assets/icons/ic_filledalert.svg';

import { colors } from '../../../shared/styles/color';
import { padding, gap } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';

const DEFAULT_LABEL = '최근 30일 동안의 알림만 확인할 수 있어요.';

// label: 안내 문구. 없으면 알림 화면 문구
const InfoBanner = ({ label = DEFAULT_LABEL }) => {
  return (
    <View style={styles.container}>
      <IcFilledAlert
        width={16}
        height={16}
        color={colors.fgNeutralTertiary}
        style={styles.icon}
      />

      <Text style={styles.text}>
        {label}
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
    backgroundColor: colors.bgBase,
  },
  icon: {
    flexShrink: 0,
  },
  text: {
    color: colors.fgNeutralTertiary,
    textAlign: 'center',
    ...typo.suitCaptionMedium400,
  },
});

export default memo(InfoBanner);
