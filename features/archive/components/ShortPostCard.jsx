import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import SuitSafeText from '../../../shared/components/atomic/SuitSafeText';
import { WriteImg, WRITE_IMG_RATIO } from '../../../shared/components/atomic/WriteImg';
import MusicCard from '../../../shared/components/content/MusicCard';

import { colors } from '../../../shared/styles/color';
import { FONT, normalizeFont } from '../../../shared/styles/fontType';
import { gap, padding, radius } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';

const CARD_WIDTH = 320;
const CONTENT_HEIGHT = 44;
const IMAGE_WIDTH = (CONTENT_HEIGHT * 4) / 3;

const CONTENT_TYPOGRAPHY = Object.freeze({
  [FONT.KYOBO]: typo.kyoboBodyMedium,
  [FONT.SUIT]: typo.suitBodyMedium,
});

const ShortPostCard = ({
  music = {},
  isPlaying = false,
  onPressPlayback,
  font = FONT.KYOBO,
  content = '',
  imageSource,
  date = '',
  onPress,
  style,
}) => {
  const hasContent = Boolean(content?.trim());
  const hasImage = Boolean(imageSource);
  const normalizedFont = normalizeFont(font);

  const PressArea = onPress ? Pressable : View;
  const pressAreaProps = onPress
    ? { onPress, accessibilityRole: 'button' }
    : null;

  return (
    <View style={[styles.container, style]}>
      <MusicCard
        imageSource={music.imageSource}
        title={music.title}
        artist={music.artist}
        isPlaying={isPlaying}
        onPressPlayback={onPressPlayback}
        font={normalizedFont}
        onPress={onPress}
        inset={false}
      />

      <PressArea style={styles.pressArea} {...pressAreaProps}>
        {/* TODO: 텍스트·이미지가 모두 있는 경우 시안 확정 후 반영 (현재는 텍스트 우선) */}
        {(hasContent || hasImage) && (
          <View style={styles.contentContainer}>
            {hasContent ? (
              <SuitSafeText
                style={[styles.contentText, CONTENT_TYPOGRAPHY[normalizedFont]]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {content}
              </SuitSafeText>
            ) : (
              <WriteImg
                imageSource={imageSource}
                ratio={WRITE_IMG_RATIO.FOUR_THREE}
                pointerEvents="none"
                style={styles.image}
              />
            )}
          </View>
        )}

        <View style={styles.dateContainer}>
          <Text style={styles.date} numberOfLines={1} ellipsizeMode="tail">
            {date}
          </Text>
        </View>
      </PressArea>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    padding: padding.L,
    alignItems: 'flex-end',
    gap: gap.XS,
    borderRadius: radius.M,
    backgroundColor: colors.bgLayerDefault,
  },

  pressArea: {
    alignSelf: 'stretch',
  },

  contentContainer: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.M,
    paddingTop: padding.S,
  },

  contentText: {
    flex: 1,
    height: CONTENT_HEIGHT,
    color: colors.fgNeutralMuted,
  },

  image: {
    width: IMAGE_WIDTH,
    height: CONTENT_HEIGHT,
  },

  dateContainer: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: padding.M,
  },

  date: {
    flex: 1,
    ...typo.suitLabelMedium,
    color: colors.fgPlaceholder,
    textAlign: 'justify',
  },
});

export default memo(ShortPostCard);
