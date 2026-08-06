import React, { memo, useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import IcMusicPlay from '../../../assets/icons/ic_musicplay.svg';
import IcMusicStop from '../../../assets/icons/ic_musicstop.svg';
import MusicWave from '../../../assets/music/musicWave.svg';
import MusicWaveTexture from '../../../assets/music/musicWaveTexture.svg';

import useAlbumWaveColor from '../../hooks/useAlbumWaveColor';
import { colors } from '../../styles/color';
import { gap, padding, radius } from '../../styles/token';
import { typo } from '../../styles/typo';

import IconButton from '../action/IconButton';
import MusicCoverImg from '../atomic/MusicCoverImg';

const MUSIC_WAVE_HEIGHT = 20;

const clampProgress = progress => {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(Math.max(progress, 0), 1);
};

const MusicCard = ({
  imageSource,
  title = '',
  artist = '',
  isPlaying = false,
  playbackProgress = 0,
  onPressPlayback,
  disabled = false,
  style,
}) => {
  const [musicWaveWidth, setMusicWaveWidth] = useState(0);
  const waveColor = useAlbumWaveColor(imageSource, isPlaying);
  const progressWidth = musicWaveWidth * clampProgress(playbackProgress);
  const PlaybackIcon = isPlaying ? IcMusicStop : IcMusicPlay;
  const accessibilityTitle = title || '음악';

  const handleMusicWaveLayout = useCallback(event => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    setMusicWaveWidth(nextWidth);
  }, []);

  return (
    <View style={[styles.container, style]}>
      <MusicCoverImg
        imageSource={imageSource}
        accessibilityLabel={`${accessibilityTitle} 앨범 커버`}
      />

      <View style={styles.contentContainer}>
        <View style={styles.musicInfoContainer}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
          <Text style={styles.artist} numberOfLines={1} ellipsizeMode="tail">
            {artist}
          </Text>
        </View>

        <View style={styles.controlContainer}>
          <IconButton
            size="S"
            icon={
              <PlaybackIcon
                width={14}
                height={14}
                fill={colors.fgBrand}
              />
            }
            onPress={onPressPlayback}
            disabled={disabled}
            accessibilityLabel={`${accessibilityTitle} 음악 ${isPlaying ? '일시정지' : '재생'}`}
            style={styles.playButton}
          />

          {isPlaying && (
            <View
              style={styles.musicWaveContainer}
              onLayout={handleMusicWaveLayout}
              pointerEvents="none"
            >
              {musicWaveWidth > 0 && (
                <>
                  <MusicWave
                    width={musicWaveWidth}
                    height={MUSIC_WAVE_HEIGHT}
                    color={colors.fgNeutralSubtlest}
                  />

                  <View style={[styles.musicWaveProgressClip, { width: progressWidth }]}>
                    <MusicWaveTexture
                      width={musicWaveWidth}
                      height={MUSIC_WAVE_HEIGHT}
                      color={waveColor}
                    />
                  </View>
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: padding.M,
    paddingHorizontal: padding.L,
    gap: gap.M,
    backgroundColor: colors.bgLayerDefault,
  },
  contentContainer: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
    gap: gap.M,
  },
  musicInfoContainer: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    gap: gap.S,
  },
  title: {
    ...typo.kyoboLabelLarge,
    width: '100%',
    color: colors.fgNeutralMuted,
  },
  artist: {
    ...typo.kyoboLabelMedium,
    width: '100%',
    color: colors.fgNeutralSubtle,
  },
  controlContainer: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.M,
  },
  playButton: {
    borderRadius: radius.XL,
    backgroundColor: colors.bgBrandWeak,
  },
  musicWaveContainer: {
    flex: 1,
    minWidth: 0,
    height: MUSIC_WAVE_HEIGHT,
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  musicWaveProgressClip: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
});

export default memo(MusicCard);