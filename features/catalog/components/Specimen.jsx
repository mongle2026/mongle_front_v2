import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../shared/styles/color';
import { gap, padding, radius } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';
import { getFiberFromRef, getTouchTargetTag, inspectSpec } from '../utils/inspectSpec';
import SpecPanel from './SpecPanel';

// 카탈로그의 큰 묶음 (Colors, Action 등)
export const CatalogSection = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const readSpec = contentRef => {
  const fiber = getFiberFromRef(contentRef.current);
  return fiber
    ? inspectSpec(fiber)
    : { instances: [], error: '렌더 트리에 접근할 수 없어요' };
};

// 컴포넌트 하나(또는 상태 하나)를 보여주는 카드. note 에는 props 요약을 적는다.
// 카드 안의 컴포넌트(버튼 하나 등)를 누르면 그 컴포넌트의 스펙이 카드 아래에 뜬다. 같은 걸 다시 누르면 닫힌다.
// showSpec={false} 면 스펙을 띄우지 않는다 (색상표처럼 스펙이 의미 없는 카드)
export const Specimen = ({ name, note, children, contentStyle, dark = false, showSpec = true }) => {
  // 선택된 컴포넌트의 순서 (카드 안 최상위 컴포넌트 기준). null 이면 닫힘
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [spec, setSpec] = useState(null);
  const contentRef = useRef(null);
  const lastSpecKeyRef = useRef(null);

  const canShowSpec = showSpec && __DEV__;

  // 눌린 네이티브 뷰가 어느 컴포넌트에 속하는지 찾는다.
  // 버튼의 onPress 를 막지 않도록 터치를 가로채지 않고 지켜보기만 한다
  const handleTouchStart = event => {
    if (!canShowSpec) return;

    const targetTag = getTouchTargetTag(event);
    if (targetTag == null) return;

    const { instances } = readSpec(contentRef);
    const index = instances.findIndex(instance => instance.tags.includes(targetTag));
    if (index === -1) return;

    setSelectedIndex(current => (current === index ? null : index));
  };

  // 열려 있는 동안 렌더될 때마다 다시 읽는다 (토글 등으로 props 가 바뀌어도 따라가게).
  // 결과가 같으면 setState 하지 않아서 렌더가 반복되지 않는다
  useEffect(() => {
    if (selectedIndex === null) {
      lastSpecKeyRef.current = null;
      if (spec !== null) setSpec(null);
      return;
    }

    const { instances, error } = readSpec(contentRef);
    const instance = instances[selectedIndex] ?? null;
    const nextSpec = { instance, error, index: selectedIndex, total: instances.length };
    const nextKey = JSON.stringify(nextSpec);

    if (nextKey !== lastSpecKeyRef.current) {
      lastSpecKeyRef.current = nextKey;
      setSpec(nextSpec);
    }
  });

  return (
    <View style={styles.specimen}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        {note ? <Text style={styles.note}>{note}</Text> : null}
        {canShowSpec ? <Text style={styles.hint}>눌러서 스펙 보기</Text> : null}
      </View>

      <View
        ref={contentRef}
        onTouchStart={handleTouchStart}
        style={[styles.content, dark && styles.contentDark, contentStyle]}
      >
        {children}
      </View>

      {canShowSpec && spec ? <SpecPanel spec={spec} onClose={() => setSelectedIndex(null)} /> : null}
    </View>
  );
};

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

  hint: {
    ...typo.suitLabelMedium,
    color: colors.fgInfo,
  },

  content: {
    gap: gap.M,
    padding: padding.L,
    alignItems: 'flex-start',
  },

  contentDark: {
    backgroundColor: colors.bgBase,
  },
});
