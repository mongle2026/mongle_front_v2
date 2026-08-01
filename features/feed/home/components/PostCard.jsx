import React, { memo } from 'react';
import { StyleSheet, Text, View, } from 'react-native';

import ProfileBar from './ProfileBar';
import ActionBar from './ActionBar';

import MusicCard from '../../../../shared/components/content/MusicCard';
import { WriteImg, } from '../../../../shared/components/atomic/WriteImg';

import { colors, } from '../../../../shared/styles/color';
import { gap, padding, radius, } from '../../../../shared/styles/token';
import { typo, } from '../../../../shared/styles/typo';

export const POST_FONT = Object.freeze({
  KYOBO: 'kyobo',
  SUIT: 'suit',
});

/**
 * 폰트가 달라지더라도 PostCard의 레이아웃이 흔들리지 않도록
 * fontSize와 lineHeight는 kyoboBodyLarge 규격으로 통일합니다.
 *
 * 사용자가 현재 설정한 폰트가 아니라
 * 게시물 작성 당시 저장된 authorFont 값을 전달해야 합니다.
 */
const POST_FONT_STYLES = Object.freeze({
  [POST_FONT.KYOBO]: typo.kyoboBodyLarge,

  [POST_FONT.SUIT]: {
    ...typo.kyoboBodyLarge,
    fontFamily: typo.suitBodyLarge.fontFamily,
  },
});

const TEXT_HEIGHT_WITH_IMAGES = 216;
const TEXT_HEIGHT_WITHOUT_IMAGES = 342;

const TEXT_LINES_WITH_IMAGES = 8;
const TEXT_LINES_WITHOUT_IMAGES = 13;

const getImageKey = (imageSource, index) => {
  if (typeof imageSource === 'string') {
    return imageSource;
  }

  if (
    imageSource &&
    typeof imageSource === 'object' &&
    imageSource.uri
  ) {
    return imageSource.uri;
  }

  return `post-image-${index}`;
};

const PostCard = ({
  profileProps,
  musicProps,
  actionProps,

  content,
  imageSources = [],

  authorFont = POST_FONT.KYOBO,

  style,
  contentAreaStyle,
  textContainerStyle,
  textStyle,
  imageContainerStyle,
  imageStyle,
}) => {
  const hasContent =
    typeof content === 'string' &&
    content.trim().length > 0;

  const visibleImages = imageSources
    .filter(Boolean)
    .slice(0, 2);

  const hasImages = visibleImages.length > 0;
  const hasTwoImages = visibleImages.length === 2;

  const normalizedAuthorFont =
    typeof authorFont === 'string'
      ? authorFont.toLowerCase()
      : POST_FONT.KYOBO;

  const authorFontStyle =
    POST_FONT_STYLES[normalizedAuthorFont] ??
    POST_FONT_STYLES[POST_FONT.KYOBO];

  const textContainerHeight = hasImages
    ? TEXT_HEIGHT_WITH_IMAGES
    : TEXT_HEIGHT_WITHOUT_IMAGES;

  const textNumberOfLines = hasImages
    ? TEXT_LINES_WITH_IMAGES
    : TEXT_LINES_WITHOUT_IMAGES;

  return (
    <View style={[styles.card, style]}>
      <ProfileBar {...profileProps} />

      <MusicCard {...musicProps} />

      <View
        style={[
          styles.contentArea,
          contentAreaStyle,
        ]}
      >
        {hasContent && (
          <View
            style={[
              styles.textContainer,
              {
                height: textContainerHeight,
              },
              textContainerStyle,
            ]}
          >
            <Text
              numberOfLines={textNumberOfLines}
              ellipsizeMode="tail"
              style={[
                styles.contentText,
                authorFontStyle,
                textStyle,
              ]}
            >
              {content}
            </Text>
          </View>
        )}

        {hasImages && (
          <View
            style={[
              styles.imageContainer,
              imageContainerStyle,
            ]}
          >
            {visibleImages.map(
              (imageSource, index) => (
                <WriteImg
                  key={getImageKey(
                    imageSource,
                    index,
                  )}
                  imageSource={imageSource}
                  style={[
                    hasTwoImages
                      ? styles.doubleImage
                      : styles.singleImage,
                    imageStyle,
                  ]}
                />
              ),
            )}
          </View>
        )}
      </View>

      <ActionBar {...actionProps} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 532,

    flexDirection: 'column',
    alignItems: 'center',

    borderRadius: radius.S,
    overflow: 'hidden',

    backgroundColor: colors.bgLayerDefault,
  },

  contentArea: {
    width: '100%',
    flex: 1,
    alignSelf: 'stretch',
  },

  textContainer: {
    width: '100%',
    paddingVertical: padding.M,
    paddingHorizontal: padding.L,

    justifyContent: 'center',
    alignItems: 'flex-start',

    overflow: 'hidden',
  },

  contentText: {
    width: '100%',

    color: colors.fgNeutralMuted,
    textAlign: 'justify',

    flexShrink: 1,
  },

  imageContainer: {
    width: '100%',
    paddingVertical: padding.S,
    paddingHorizontal: padding.L,

    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: gap.M,
  },

  singleImage: {
    width: '50%',
  },

  doubleImage: {
    /**
     * WriteImg 기본 width가 50%이기 때문에
     * 두 장에서 50% + 50% + gap이 되면 넘칠 수 있습니다.
     *
     * width: 0과 flex: 1을 함께 사용해
     * gap을 제외한 공간을 정확히 절반씩 나눕니다.
     */
    width: 0,
    flex: 1,
  },
});

export default memo(PostCard);