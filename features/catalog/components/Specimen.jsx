import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../shared/styles/color';
import { gap, padding, radius } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';

// 카탈로그의 큰 묶음 (Colors, Action 등)
export const CatalogSection = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

// 컴포넌트 하나(또는 상태 하나)를 보여주는 카드. note 에는 props 요약을 적는다
export const Specimen = ({ name, note, children, contentStyle, dark = false }) => (
  <View style={styles.specimen}>
    <View style={styles.header}>
      <Text style={styles.name}>{name}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
    <View style={[styles.content, dark && styles.contentDark, contentStyle]}>
      {children}
    </View>
  </View>
);

const styles = StyleSheet.create({
  section: {
    gap: gap.L,
    paddingHorizontal: padding.XL,
    paddingVertical: padding.XXL,
  },

  sectionTitle: {
    ...typo.suitTitleXLargeStrong,
    color: colors.fgNeutralPrimary,
  },

  specimen: {
    borderRadius: radius.XL,
    borderWidth: 1,
    borderColor: colors.strokeNeutralQuaternary,
    backgroundColor: colors.bgSurface,
    overflow: 'hidden',
  },

  header: {
    gap: gap.S,
    paddingHorizontal: padding.L,
    paddingVertical: padding.M,
    borderBottomWidth: 1,
    borderBottomColor: colors.strokeNeutralQuaternary,
  },

  name: {
    ...typo.suitLabelLargeStrong,
    color: colors.fgNeutralPrimary,
  },

  note: {
    ...typo.suitLabelMedium,
    color: colors.fgNeutralTertiary,
  },

  content: {
    gap: gap.M,
    padding: padding.L,
    alignItems: 'flex-start',
  },

  contentDark: {
    backgroundColor: colors.bgLayerBase,
  },
});
