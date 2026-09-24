import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import MusicCoverImg from '../../../shared/components/atomic/MusicCoverImg';

import { colors, palette } from '../../../shared/styles/color';
import { padding, radius } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';

const CARD_SIZE = 144;

// linear-gradient(0deg, neutral/950 @ 50% → neutral/950 @ 0%)
const GRADIENT_COLORS = [palette.overlay.default, '#1e212500'];

const GenreCard = ({ genre, imageSource, style }) => {
  return (
    <View style={[styles.container, style]}>
      <MusicCoverImg
        imageSource={imageSource}
        size={CARD_SIZE}
        accessibilityLabel={`${genre} 장르 커버`}
        style={styles.cover}
      />

      <LinearGradient
        pointerEvents="none"
        colors={GRADIENT_COLORS}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.gradient}
      />

      <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
        {genre}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    padding: padding.L,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    borderRadius: radius.S,
    overflow: 'hidden',
  },
  cover: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: CARD_SIZE,
    height: CARD_SIZE / 2,
  },
  label: {
    alignSelf: 'stretch',
    ...typo.suitLabelLargeStrong,
    color: colors.fgNeutralInverted,
  },
});

export default memo(GenreCard);
