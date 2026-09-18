import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import IcMusicPlay from '../../../assets/icons/ic_musicplay.svg';
import IcMusicStop from '../../../assets/icons/ic_musicstop.svg';

import { colors } from '../../styles/color';
import { FONT } from '../../styles/font';
import { gap, padding } from '../../styles/token';
import { typo } from '../../styles/typo';

import IconButton from '../action/IconButton';
import MusicCoverImg from '../atomic/MusicCoverImg';

const TITLE_TYPOGRAPHY = Object.freeze({
  [FONT.KYOBO]: typo.kyoboLabelLarge,
  [FONT.SUIT]: typo.suitLabelLarge,
});

const ARTIST_TYPOGRAPHY = Object.freeze({
  [FONT.KYOBO]: typo.kyoboLabelMedium,
  [FONT.SUIT]: typo.suitLabelMedium,
});

const MusicCard = ({
  imageSource,
  title = '',
  artist = '',
  font = FONT.KYOBO,
  isPlaying = false,
  onPressPlayback,
  onPress,
  pressAccessibilityLabel,
  disabled = false,
  style,
}) => {
  const PlaybackIcon = isPlaying ? IcMusicStop : IcMusicPlay;

  const accessibilityTitle = title || '음악';
  const titleTypography = TITLE_TYPOGRAPHY[font] ?? TITLE_TYPOGRAPHY[FONT.KYOBO];
  const artistTypography = ARTIST_TYPOGRAPHY[font] ?? ARTIST_TYPOGRAPHY[FONT.KYOBO];

  const handlePressPlayback = useCallback(
    event => {
      event.stopPropagation?.();
      onPressPlayback?.();
    },
    [onPressPlayback]
  );

  // 카드 본문과 재생 버튼을 형제로 분리해, 재생 버튼 터치가 onPress로 전달되지 않도록 합니다.
  const PressArea = onPress ? Pressable : View;
  const pressAreaProps = onPress
    ? {
      onPress,
      accessibilityRole: 'button',
      accessibilityLabel: pressAccessibilityLabel,
    }
    : null;

  return (
    <View style={[styles.container, style]}>
      <PressArea style={styles.pressArea} {...pressAreaProps}>
        <MusicCoverImg
          imageSource={imageSource}
          accessibilityLabel={`${accessibilityTitle} 앨범 커버`}
        />

        <View style={styles.musicInfoContainer}>
          <Text
            allowFontScaling={false}
            style={[styles.title, titleTypography]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>

          <Text
            allowFontScaling={false}
            style={[styles.artist, artistTypography]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {artist}
          </Text>
        </View>
      </PressArea>

      <View style={styles.playButtonContainer}>
        <IconButton
          size="L"
          icon={PlaybackIcon}
          color={colors.fgNeutralSolid}
          onPress={handlePressPlayback}
          disabled={disabled}
          accessibilityLabel={`${accessibilityTitle} 음악 ${isPlaying ? '일시정지' : '재생'}`}
          style={styles.playButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: padding.L,
    gap: gap.M,
    backgroundColor: colors.bgLayerDefault,
  },

  pressArea: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: padding.M,
    paddingLeft: padding.L,
    gap: gap.M,
  },

  playButtonContainer: {
    paddingVertical: padding.M,
  },

  musicInfoContainer: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
    gap: padding.XS,
  },

  title: {
    width: '100%',
    color: colors.fgNeutralMuted,
  },

  artist: {
    width: '100%',
    color: colors.fgNeutralSubtle,
  },

  playButton: {
    borderRadius: 999,
    backgroundColor: colors.bgNeutralFaint,
  },
});

export default memo(MusicCard);