import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { colors } from '../../styles/color';
import { gap } from '../../styles/token';
import { typo } from '../../styles/typo';

const TERMS_URL =
  'https://mongle-music-letter.notion.site/4058a27574f080d49a63e15237a48fb3';
const PRIVACY_URL =
  'https://mongle-music-letter.notion.site/4058a27574f0800e9b0fd1a49021ad73';

// 이용약관 · 개인정보처리방침 링크.
// 가로 배치 · 간격은 공통이고, 바깥 여백처럼 쓰는 곳마다 다른 건 style 로 받는다
const PolicyLinks = ({ style }) => (
  <View style={[styles.container, style]}>
    <Text
      style={[styles.linkText, styles.linkUnderline]}
      accessibilityRole="link"
      onPress={() => WebBrowser.openBrowserAsync(TERMS_URL)}
    >
      이용약관
    </Text>

    <Text style={styles.linkText}>·</Text>

    <Text
      style={[styles.linkText, styles.linkUnderline]}
      accessibilityRole="link"
      onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)}
    >
      개인정보처리방침
    </Text>
  </View>
);

export default PolicyLinks;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.M,
  },

  linkText: {
    ...typo.suitLabelMediumStrong,

    color: colors.fgNeutralTertiary,
  },

  linkUnderline: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
  },
});
