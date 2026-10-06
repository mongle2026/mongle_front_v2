import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BUTTON_VARIANT } from '../../../shared/components/action/Button';
import CdCover from '../../../shared/components/atomic/CdCover';
import FontFallbackText from '../../../shared/components/atomic/FontFallbackText';
import { WriteImg, WRITE_IMG_RATIO } from '../../../shared/components/atomic/WriteImg';
import Profile from '../../../shared/components/content/profile/Profile';

import { colors } from '../../../shared/styles/color';
import { FONT, normalizeFont } from '../../../shared/styles/fontType';
import { gap, padding, radius } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';
import { formatDateDetail } from '../../../shared/utils/dateUtils';
import { getImageKey } from '../../../shared/utils/media';

const CONTENT_HEIGHT = 44;
const IMAGE_WIDTH = (CONTENT_HEIGHT * 4) / 3;
const CD_SIZE = 24;

const MUSIC_TITLE_TYPOGRAPHY = Object.freeze({
  [FONT.KYOBO]: typo.kyoboLabelLarge,
  [FONT.SUIT]: typo.suitLabelLarge,
});

const CONTENT_TYPOGRAPHY = Object.freeze({
  [FONT.KYOBO]: typo.kyoboBodyMedium,
  [FONT.SUIT]: typo.suitBodyMedium,
});

const OthersPostCard = ({
  // 작성자 프로필
  profile = {},
  onPressProfile,
  music = {},
  font = FONT.KYOBO,
  content = '',
  // 이미지 목록. 텍스트가 없을 때 개수만큼 나란히 보여준다
  imageSources = [],
  // 백엔드 값(ISO 문자열 등). 상대 시간 없이 yy.mm.dd hh:mm 으로 표기
  date = '',
  onPress,
  style,
}) => {
  const hasContent = Boolean(content?.trim());
  const hasImage = imageSources.length > 0;
  const normalizedFont = normalizeFont(font);
  const musicImageUri =
    typeof music.imageSource === 'string' ? music.imageSource : music.imageSource?.uri;

  const PressArea = onPress ? Pressable : View;
  const pressAreaProps = onPress
    ? { onPress, accessibilityRole: 'button' }
    : null;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.profileMusicContainer}>
        {/* 팔로우한 사람이면 Solid, 아니면 Ghost */}
        <Profile
          imageUri={profile.imageUri}
          username={profile.username}
          variant={profile.isFollowing ? BUTTON_VARIANT.SOLID : BUTTON_VARIANT.GHOST}
          onPress={onPressProfile}
          font={normalizedFont}
        />

        <View style={styles.cdContainer}>
          <CdCover imageUri={musicImageUri} size={CD_SIZE} />
          <FontFallbackText
            style={[styles.musicTitle, MUSIC_TITLE_TYPOGRAPHY[normalizedFont]]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {music.title}
          </FontFallbackText>
        </View>
      </View>

      <PressArea style={styles.pressArea} {...pressAreaProps}>
        {/* 텍스트·이미지가 모두 있으면 텍스트만, 이미지만 있으면 이미지를 모두 노출한다 */}
        {(hasContent || hasImage) && (
          <View style={styles.contentContainer}>
            {hasContent ? (
              <FontFallbackText
                style={[styles.contentText, CONTENT_TYPOGRAPHY[normalizedFont]]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {content}
              </FontFallbackText>
            ) : (
              imageSources.map((imageSource, index) => (
                <WriteImg
                  key={getImageKey(imageSource, index)}
                  imageSource={imageSource}
                  ratio={WRITE_IMG_RATIO.FOUR_THREE}
                  pointerEvents="none"
                  style={styles.image}
                />
              ))
            )}
          </View>
        )}

        <View style={styles.dateContainer}>
          <Text style={styles.date} numberOfLines={1} ellipsizeMode="tail">
            {date ? formatDateDetail(date) : ''}
          </Text>
        </View>
      </PressArea>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: padding.L,
    alignItems: 'flex-end',
    gap: gap.XS,
    borderRadius: radius.S,
    backgroundColor: colors.bgSurface,
  },

  profileMusicContainer: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cdContainer: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.S,
  },

  musicTitle: {
    flexShrink: 1,
    color: colors.fgNeutralPrimary,
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
    color: colors.fgNeutralSecondary,
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
    color: colors.fgNeutralTertiary,
    textAlign: 'justify',
  },
});

export default memo(OthersPostCard);
