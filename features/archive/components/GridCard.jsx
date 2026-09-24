import React, { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import IcArrowRight from '../../../assets/icons/ic_arrow_right.svg';
import MusicCoverImg from '../../../shared/components/atomic/MusicCoverImg';

import { colors } from '../../../shared/styles/color';
import { gap, padding, radius } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';

const CARD_WIDTH = 171.5;
const COVER_SIZE = 32;
const ICON_SIZE = 14;

const GridCard = ({ title, imageSource, onPress, style }) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[styles.container, style]}
    >
      <MusicCoverImg
        imageSource={imageSource}
        size={COVER_SIZE}
        accessibilityLabel={`${title} 커버`}
      />

      <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
        {title}
      </Text>

      <IcArrowRight
        width={ICON_SIZE}
        height={ICON_SIZE}
        color={colors.fgNeutralFaint}
        fill={colors.fgNeutralFaint}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    padding: padding.M,
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.M,
    borderRadius: radius.S,
    backgroundColor: colors.bgLayerDefault,
  },
  label: {
    flex: 1,
    ...typo.suitLabelMediumStrong,
    color: colors.fgNeutralSolid,
  },
});

export default memo(GridCard);
