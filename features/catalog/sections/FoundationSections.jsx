import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, palette } from '../../../shared/styles/color';
import { gap, padding, radius } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';
import { CatalogSection, Specimen } from '../components/Specimen';

// 시맨틱 토큰을 이름 접두어(bg / fill / stroke / fg)로 묶는다
const TOKEN_GROUPS = ['bg', 'fill', 'stroke', 'fg'].map(prefix => ({
  prefix,
  entries: Object.entries(colors).filter(([name]) => name.startsWith(prefix)),
}));

// 값이 같은 palette 이름 (예: neutral/1000). 알파가 붙은 값은 앞 7자리로 찾고 % 를 붙인다
const describeColor = value => {
  const base = value.slice(0, 7).toLowerCase();
  const alpha = value.length > 7 ? Math.round((parseInt(value.slice(7), 16) / 255) * 100) : null;

  let paletteName = base === '#000000' ? 'black' : null;
  Object.entries(palette).forEach(([family, steps]) => {
    Object.entries(steps).forEach(([step, hex]) => {
      if (hex.toLowerCase() === base) paletteName = `${family}/${step}`;
    });
  });

  return [paletteName ?? base, alpha !== null && `${alpha}%`].filter(Boolean).join(' · ');
};

const Swatch = ({ color, size = 28 }) => (
  <View style={[styles.swatch, { width: size, height: size }]}>
    <View style={[StyleSheet.absoluteFill, { backgroundColor: color }]} />
  </View>
);

const PaletteSection = () => (
  <CatalogSection title="Palette">
    {Object.entries(palette).map(([family, steps]) => (
      <Specimen key={family} name={`color / ${family}`}>
        <View style={styles.paletteRow}>
          {Object.entries(steps).map(([step, hex]) => (
            <View key={step} style={styles.paletteCell}>
              <Swatch color={hex} size={40} />
              <Text style={styles.caption}>{step}</Text>
              <Text style={styles.captionWeak}>{hex.slice(1).toUpperCase()}</Text>
            </View>
          ))}
        </View>
      </Specimen>
    ))}
  </CatalogSection>
);

const SemanticColorSection = () => (
  <CatalogSection title="Semantic Colors">
    {TOKEN_GROUPS.map(({ prefix, entries }) => (
      <Specimen key={prefix} name={prefix} contentStyle={styles.tokenList}>
        {entries.map(([name, value]) => (
          <View key={name} style={styles.tokenRow}>
            <Swatch color={value} />
            <Text style={styles.tokenName}>{name}</Text>
            <Text style={styles.captionWeak}>{describeColor(value)}</Text>
          </View>
        ))}
      </Specimen>
    ))}
  </CatalogSection>
);

const TypographySection = () => (
  <CatalogSection title="Typography">
    {['suit', 'kyobo'].map(prefix => (
      <Specimen key={prefix} name={prefix === 'suit' ? 'SUITX' : 'Kyobo Handwriting 2025'}>
        {Object.entries(typo)
          .filter(([name]) => name.startsWith(prefix))
          .map(([name, style]) => (
            <View key={name} style={styles.typoRow}>
              <Text style={styles.captionWeak}>
                {name} · {style.fontSize}/{style.lineHeight}
              </Text>
              <Text style={[style, styles.typoSample]}>몽글몽글 Mongle 123</Text>
            </View>
          ))}
      </Specimen>
    ))}
  </CatalogSection>
);

const ScaleRow = ({ title, scale, render }) => (
  <Specimen name={title}>
    {Object.entries(scale).map(([key, value]) => (
      <View key={key} style={styles.scaleRow}>
        <Text style={styles.scaleLabel}>{key} · {value}</Text>
        {render(value)}
      </View>
    ))}
  </Specimen>
);

const LayoutTokenSection = () => (
  <CatalogSection title="Layout Tokens">
    <ScaleRow
      title="padding"
      scale={padding}
      render={value => <View style={[styles.bar, { width: value * 4 }]} />}
    />
    <ScaleRow
      title="gap"
      scale={gap}
      render={value => <View style={[styles.bar, { width: value * 4 }]} />}
    />
    <ScaleRow
      title="radius"
      scale={radius}
      render={value => <View style={[styles.radiusBox, { borderRadius: Math.min(value, 24) }]} />}
    />
  </CatalogSection>
);

export const FOUNDATION_SECTIONS = [
  { key: 'palette', label: 'Palette', Component: PaletteSection },
  { key: 'semantic', label: 'Semantic', Component: SemanticColorSection },
  { key: 'typo', label: 'Typography', Component: TypographySection },
  { key: 'layout', label: 'Layout', Component: LayoutTokenSection },
];

const styles = StyleSheet.create({
  swatch: {
    borderRadius: radius.XS,
    borderWidth: 1,
    borderColor: colors.strokeNeutralQuaternary,
    overflow: 'hidden',
  },

  paletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: gap.M,
  },

  paletteCell: {
    width: 56,
    alignItems: 'center',
    gap: gap.XS,
  },

  caption: {
    ...typo.suitLabelMediumStrong,
    color: colors.fgNeutralSecondary,
  },

  captionWeak: {
    ...typo.suitLabelMedium,
    color: colors.fgNeutralQuaternary,
  },

  tokenList: {
    alignItems: 'stretch',
  },

  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.M,
  },

  tokenName: {
    ...typo.suitLabelMedium,
    flex: 1,
    color: colors.fgNeutralPrimary,
  },

  typoRow: {
    gap: gap.XS,
  },

  typoSample: {
    color: colors.fgNeutralPrimary,
  },

  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.L,
  },

  scaleLabel: {
    ...typo.suitLabelMedium,
    width: 72,
    color: colors.fgNeutralTertiary,
  },

  bar: {
    height: 12,
    borderRadius: radius.XS,
    backgroundColor: colors.fillInfo,
  },

  radiusBox: {
    width: 48,
    height: 48,
    backgroundColor: colors.fillInfoWeak,
    borderWidth: 1,
    borderColor: colors.strokeInfo,
  },
});
