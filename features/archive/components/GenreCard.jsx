import React, { memo, useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import MusicCoverImg from '../../../shared/components/atomic/MusicCoverImg';

import { colors, palette } from '../../../shared/styles/color';
import { padding, radius } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';

// linear-gradient(0deg, neutral/950 @ 50% → neutral/950 @ 0%)
const GRADIENT_COLORS = [palette.overlay.default, '#1e212500'];

// 크기는 부모(style.width 등)가 정하고 카드는 1:1 비율만 유지한다.
// MusicCoverImg(Skia)는 숫자 size가 필요해서 레이아웃 후 측정한 폭을 넘긴다.
const GenreCard = ({ genre, imageSource, onPress, style }) => {
  const [cardSize, setCardSize] = useState(0);

  const handleLayout = useCallback(e => {
    setCardSize(e.nativeEvent.layout.width);
  }, []);

  const Container = onPress ? Pressable : View;
  const containerProps = onPress
    ? { onPress, accessibilityRole: 'button', accessibilityLabel: `${genre} 장르 기록 보기` }
    : null;

  return (
    <Container style={[styles.container, style]} onLayout={handleLayout} {...containerProps}>
      {cardSize > 0 && (
        <MusicCoverImg
          imageSource={imageSource}
          size={cardSize}
          accessibilityLabel={`${genre} 장르 커버`}
          style={styles.cover}
        />
      )}

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
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    aspectRatio: 1,
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
    right: 0,
    bottom: 0,
    height: '50%',
  },
  label: {
    alignSelf: 'stretch',
    ...typo.suitLabelLargeStrong,
    color: colors.fgNeutralInverted,
  },
});

export default memo(GenreCard);
