import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import FontFallbackText from '../../../shared/components/atomic/FontFallbackText';
import { WriteImg, WRITE_IMG_RATIO } from '../../../shared/components/atomic/WriteImg';
import MusicCard from '../../../shared/components/content/MusicCard';

import { colors } from '../../../shared/styles/color';
import { FONT, normalizeFont } from '../../../shared/styles/fontType';
import { gap, padding, radius } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';
import { formatDateDetail } from '../../../shared/utils/dateUtils';
import { getImageKey } from '../../../shared/utils/media';

const CONTENT_HEIGHT = 44;
const IMAGE_WIDTH = (CONTENT_HEIGHT * 4) / 3;

const CONTENT_MAX_LINES = 2;

// 글은 두 줄까지. 높이를 딱 두 줄로 잡아야 iOS 가 둘째 줄을 잘라 내지 않는다
// (교보 줄 높이 22.4 × 2 = 44.8 이라 44 로 고정하면 한 줄만 보였다)
const withContentHeight = typography => ({
  ...typography,
  height: typography.lineHeight * CONTENT_MAX_LINES,
});

const CONTENT_TYPOGRAPHY = Object.freeze({
  [FONT.KYOBO]: withContentHeight(typo.kyoboBodyMedium),
  [FONT.SUIT]: withContentHeight(typo.suitBodyMedium),
});

const ShortPostCard = ({
  feedId,
  // music.previewUrl 이 있어야 재생 버튼이 활성화된다
  music = {},
  isPlaying = false,
  onPressPlayback,
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
  const previewUrl = music.previewUrl;

  // 피드와 같이 { feedId, previewUrl } 를 넘겨 useFeedMusicPlayback 의 handlePressPlayback 에 바로 연결한다
  const handlePressPlayback = useCallback(() => {
    if (!previewUrl) return;
    onPressPlayback?.({ feedId, previewUrl });
  }, [feedId, previewUrl, onPressPlayback]);

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
        disabled={!previewUrl}
        onPressPlayback={previewUrl ? handlePressPlayback : undefined}
        font={normalizedFont}
        onPress={onPress}
        inset={false}
        coverSize={56}
      />

      <PressArea style={styles.pressArea} {...pressAreaProps}>
        {/* 텍스트·이미지가 모두 있으면 텍스트만, 이미지만 있으면 이미지를 모두 노출한다 */}
        {(hasContent || hasImage) && (
          <View style={styles.contentContainer}>
            {hasContent ? (
              <FontFallbackText
                style={[styles.contentText, CONTENT_TYPOGRAPHY[normalizedFont]]}
                numberOfLines={CONTENT_MAX_LINES}
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
                  borderRadius={radius.XS}
                  pointerEvents="none"
                  style={styles.image}
                />
              ))
            )}
          </View>
        )}

        {/* 날짜를 안 넘기면 줄째로 그리지 않는다 (보관함 홈 최근 기록) */}
        {date ? (
          <View style={styles.dateContainer}>
            <Text style={styles.date} numberOfLines={1} ellipsizeMode="tail">
              {formatDateDetail(date)}
            </Text>
          </View>
        ) : null}
      </PressArea>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: padding.L,
    alignItems: 'flex-end',
    gap: gap.XS,
    borderRadius: radius.M,
    backgroundColor: colors.bgSurface,
  },

  pressArea: {
    alignSelf: 'stretch',
  },

  contentContainer: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.S,
    paddingTop: padding.S,
  },

  contentText: {
    flex: 1,
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

export default memo(ShortPostCard);
