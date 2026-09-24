import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Pressable as GesturePressable } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import IcMusicPlay from '../../../assets/icons/ic_musicplay.svg';
import IcMusicStop from '../../../assets/icons/ic_musicstop.svg';

import { colors } from '../../styles/color';
import { FONT } from '../../styles/fontType';
import usePressAnimation from '../../hooks/usePressAnimation';
import { gap, padding } from '../../styles/token';
import { typo } from '../../styles/typo';

import MusicCoverImg from '../atomic/MusicCoverImg';

const TITLE_TYPOGRAPHY = Object.freeze({
  [FONT.KYOBO]: typo.kyoboLabelLarge,
  [FONT.SUIT]: typo.suitLabelLarge,
});

const ARTIST_TYPOGRAPHY = Object.freeze({
  [FONT.KYOBO]: typo.kyoboLabelMedium,
  [FONT.SUIT]: typo.suitLabelMedium,
});

const PLAY_ICON_SIZE = 20;

const MusicCard = ({
  imageSource,
  title = '',
  artist = '',
  font = FONT.KYOBO,
  isPlaying = false,
  onPressPlayback,
  onPress,
  onPressIn,
  onPressMove,
  onPressOut,
  pressAccessibilityLabel,
  disabled = false,
  inset = true,
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

  const {
    animatedStyle: playButtonAnimatedStyle,
    pressHandlers: playButtonPressHandlers,
  } = usePressAnimation({ onPress: disabled ? undefined : handlePressPlayback });

  // 카드 본문과 재생 버튼을 형제로 분리해, 재생 버튼 터치가 onPress로 전달되지 않도록 합니다.
  const PressArea = onPress ? Pressable : View;
  const pressAreaProps = onPress
    ? {
      onPress,
      onPressIn,
      onPressMove,
      onPressOut,
      accessibilityRole: 'button',
      accessibilityLabel: pressAccessibilityLabel,
    }
    : null;

  return (
    <View style={[styles.container, !inset && styles.containerNoInset, style]}>
      <PressArea
        style={[styles.pressArea, !inset && styles.pressAreaNoInset]}
        {...pressAreaProps}
      >
        <MusicCoverImg
          imageSource={imageSource}
          accessibilityLabel={`${accessibilityTitle} 앨범 커버`}
        />

        <View style={styles.musicInfoContainer}>
          <Text
            style={[styles.title, titleTypography]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>

          <Text
            style={[styles.artist, artistTypography]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {artist}
          </Text>
        </View>
      </PressArea>

      <Animated.View style={[inset && styles.playButtonContainer, playButtonAnimatedStyle]}>
        <GesturePressable
          {...playButtonPressHandlers}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`${accessibilityTitle} 음악 ${isPlaying ? '일시정지' : '재생'}`}
          accessibilityState={{ disabled }}
          style={[styles.playButton, disabled && styles.playButtonDisabled]}
        >
          <View pointerEvents="none" style={styles.playIcon}>
            <PlaybackIcon
              width={PLAY_ICON_SIZE}
              height={PLAY_ICON_SIZE}
              color={colors.fgNeutralSolid}
              fill={colors.fgNeutralSolid}
            />
          </View>
        </GesturePressable>
      </Animated.View>
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

  // inset=false: 부모 카드가 패딩을 가질 때 내부 패딩 제거
  containerNoInset: {
    paddingRight: 0,
  },

  pressAreaNoInset: {
    paddingVertical: 0,
    paddingLeft: 0,
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: padding.L,
    borderRadius: 999,
    backgroundColor: colors.bgNeutralFaint,
  },

  playButtonDisabled: {
    opacity: 0.4,
  },

  playIcon: {
    width: PLAY_ICON_SIZE,
    height: PLAY_ICON_SIZE,
  },
});

export default memo(MusicCard);