import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../shared/styles/color';
import { gap, padding, radius } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';

// 태그로 이미 보여준 props 와 제목(children)은 상세 목록에서 뺀다
const HIDDEN_DETAIL_PROPS = new Set(['variant', 'type', 'size', 'font', 'ratio', 'dateFormat', 'children']);

const Row = ({ name, value, token, swatch }) => (
  <View style={styles.row}>
    <Text style={styles.key}>{name}</Text>
    <View style={styles.valueLine}>
      {swatch ? <View style={[styles.chip, { backgroundColor: swatch }]} /> : null}
      <Text style={styles.value}>
        {value}
        {token ? <Text style={styles.token}>{`   ${token}`}</Text> : null}
      </Text>
    </View>
  </View>
);

// 컴포넌트 하나(버튼 하나 등)의 스펙 묶음
const InstanceCard = ({ instance }) => {
  const detailProps = instance.props.filter(prop => !HIDDEN_DETAIL_PROPS.has(prop.key));

  return (
    <View style={styles.instance}>
      <View style={styles.instanceHeader}>
        <Text style={styles.instanceName}>
          {instance.name}
          {instance.title ? <Text style={styles.instanceTitle}>{`  "${instance.title}"`}</Text> : null}
        </Text>

        {instance.summary.length > 0 ? (
          <View style={styles.tags}>
            {instance.summary.map(tag => (
              <View key={tag.key} style={styles.tag}>
                <Text style={styles.tagKey}>{tag.key}</Text>
                <Text style={styles.tagValue}>{tag.value}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {detailProps.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>props</Text>
          {detailProps.map(prop => (
            <Row key={prop.key} name={prop.key} value={prop.value} swatch={prop.swatch} />
          ))}
        </View>
      ) : null}

      {instance.nodes.map((node, index) => (
        <View key={`${node.label}-${index}`} style={styles.block}>
          <Text style={styles.blockTitle}>{node.label}</Text>
          {node.rows.map(row => (
            <Row key={row.key} name={row.key} value={row.value} token={row.token} swatch={row.swatch} />
          ))}
        </View>
      ))}
    </View>
  );
};

// 카드에서 선택한 컴포넌트 하나의 스펙
const SpecPanel = ({ spec, onClose }) => {
  if (!spec) return null;

  const { instance, error, index, total } = spec;

  return (
    <View style={styles.container}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{`스펙 ${index + 1} / ${total}`}</Text>
        <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
          <Text style={styles.close}>닫기</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>스펙을 읽지 못했어요: {error}</Text> : null}
      {instance ? <InstanceCard instance={instance} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: gap.L,
    padding: padding.L,
    borderTopWidth: 1,
    borderTopColor: colors.strokeNeutralQuaternary,
    backgroundColor: colors.bgBase,
  },

  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  panelTitle: {
    ...typo.suitLabelMediumStrong,
    color: colors.fgNeutralSecondary,
  },

  close: {
    ...typo.suitLabelMediumStrong,
    color: colors.fgInfo,
  },

  instance: {
    borderRadius: radius.S,
    backgroundColor: colors.bgSurface,
    overflow: 'hidden',
  },

  instanceHeader: {
    gap: gap.M,
    padding: padding.L,
    borderBottomWidth: 1,
    borderBottomColor: colors.strokeNeutralQuaternary,
  },

  instanceName: {
    ...typo.suitLabelLargeStrong,
    color: colors.fgInfo,
  },

  instanceTitle: {
    ...typo.suitLabelLarge,
    color: colors.fgNeutralPrimary,
  },

  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: gap.S,
  },

  tag: {
    flexDirection: 'row',
    gap: gap.S,
    paddingHorizontal: padding.S,
    paddingVertical: padding.XXS,
    borderRadius: radius.XS,
    backgroundColor: colors.fillNeutralWeak,
  },

  tagKey: {
    ...typo.suitLabelMedium,
    color: colors.fgNeutralTertiary,
  },

  tagValue: {
    ...typo.suitLabelMediumStrong,
    color: colors.fgNeutralPrimary,
  },

  block: {
    gap: gap.S,
    paddingHorizontal: padding.L,
    paddingVertical: padding.M,
    borderBottomWidth: 1,
    borderBottomColor: colors.strokeNeutralQuaternary,
  },

  blockTitle: {
    ...typo.suitLabelMediumStrong,
    color: colors.fgNeutralSecondary,
  },

  row: {
    flexDirection: 'row',
    gap: gap.M,
  },

  key: {
    ...typo.suitLabelMedium,
    width: 112,
    color: colors.fgNeutralTertiary,
  },

  valueLine: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.S,
  },

  chip: {
    width: 12,
    height: 12,
    borderRadius: radius.XS,
    borderWidth: 1,
    borderColor: colors.strokeNeutralTertiary,
  },

  value: {
    ...typo.suitLabelMedium,
    flex: 1,
    color: colors.fgNeutralPrimary,
  },

  token: {
    color: colors.fgPositive,
  },

  empty: {
    ...typo.suitLabelMedium,
    color: colors.fgNeutralQuaternary,
  },

  error: {
    ...typo.suitLabelMedium,
    color: colors.fgCritical,
  },
});

export default SpecPanel;
