import React, { memo } from 'react';
import { StyleSheet, Text, View, } from 'react-native';

import IcMusicPlay from '../../../assets/icons/ic_musicplay.svg';
import IcMusicStop from '../../../assets/icons/ic_musicstop.svg';

import { colors } from '../../styles/color';
import { gap, padding, radius, } from '../../styles/token';
import { typo } from '../../styles/typo';

import IconButton from '../action/IconButton';
import MusicCoverImg from '../atomic/MusicCoverImg';

const MusicCard = ({
  imageSource,
  title,
  artist,
  isPlaying = false,
  onPressPlayback,
  disabled = false,
  style,
}) => {
  const playbackAccessibilityLabel =
    isPlaying
      ? `${title} 음악 정지`
      : `${title} 음악 재생`;

  return (
    <View
      style={[
        styles.container,
        style,
      ]}
    >
      <MusicCoverImg
        imageSource={imageSource}
        accessibilityLabel={
          `${title} 앨범 커버`
        }
      />

      <View style={styles.contentContainer}>
        <View style={styles.musicInfoContainer}>
          <Text
            style={styles.title}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>

          <Text
            style={styles.artist}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {artist}
          </Text>
        </View>

        <View style={styles.controlContainer}>
          <IconButton
            size="M"
            icon={
              isPlaying
                ? (
                  <IcMusicStop
                    width={18}
                    height={18}
                  />
                )
                : (
                  <IcMusicPlay
                    width={18}
                    height={18}
                  />
                )
            }
            onPress={onPressPlayback}
            disabled={disabled}
            accessibilityLabel={
              playbackAccessibilityLabel
            }
            style={styles.playButton}
          />

          {/*
            MusicWave의 디자인과 동작이 정해지면
            이 위치에 추가합니다.

            <MusicWave isPlaying={isPlaying} />
          */}
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
    backgroundColor:
      colors.bgLayerDefault,
  },

  contentContainer: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
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
    backgroundColor:
      colors.bgBrandWeak,
  },
});

export default memo(MusicCard);