import React, { memo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WriteImg } from '../../../../shared/components/atomic/WriteImg';
import { colors } from '../../../../shared/styles/color';
import { gap, padding } from '../../../../shared/styles/token';
import { typo } from '../../../../shared/styles/typo';

const DETAIL_CONTENT_MIN_HEIGHT = 418;

const POST_FONT = {
  KYOBO: 'kyobo',
  SUIT: 'suit',
};

const POST_FONT_STYLES = {
  [POST_FONT.KYOBO]: typo.kyoboBodyLarge,
  [POST_FONT.SUIT]: {
    ...typo.kyoboBodyLarge,
    fontFamily: typo.suitBodyLarge.fontFamily,
  },
};

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

  return `detail-image-${index}`;
};

const FeedDetailContent = ({
  content = '',
  imageSources = [],
  authorFont = POST_FONT.KYOBO,
  onPress,
  onPressImage,
}) => {
  const hasContent =
    typeof content === 'string' &&
    content.trim().length > 0;

  const visibleImages =
    imageSources.filter(Boolean);

  const normalizedAuthorFont =
    typeof authorFont === 'string'
      ? authorFont.toLowerCase()
      : POST_FONT.KYOBO;

  const authorFontStyle =
    POST_FONT_STYLES[normalizedAuthorFont] ??
    POST_FONT_STYLES[POST_FONT.KYOBO];

  return (
    <View style={styles.container}>
      {hasContent && (
        <Pressable
          onPress={onPress}
          style={styles.textContainer}
        >
          <Text
            style={[
              styles.contentText,
              authorFontStyle,
            ]}
          >
            {content}
          </Text>
        </Pressable>
      )}
      {visibleImages.length > 0 && (
        <View style={styles.imgContainer}>
          {visibleImages.map(
            (imageSource, index) => (
              <Pressable
                key={getImageKey(
                  imageSource,
                  index,
                )}
                onPress={() =>
                  onPressImage?.(
                    imageSource,
                    index,
                  )
                }
                style={styles.imageButton}
              >
                <WriteImg
                  imageSource={imageSource}
                  pointerEvents="none"
                  style={styles.image}
                />
              </Pressable>
            ),
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: DETAIL_CONTENT_MIN_HEIGHT,
    alignSelf: 'stretch',
    alignItems: 'flex-start',
  },
  textContainer: {
    width: '100%',
    paddingVertical: padding.XXS,
    paddingHorizontal: padding.L,
    alignItems: 'flex-start',
  },
  contentText: {
    width: '100%',
    flexWrap: 'wrap',
    color: colors.fgNeutralMuted,
    textAlign: 'justify',
  },
  imgContainer: {
    width: '100%',
    paddingTop: 0,
    paddingBottom: padding.M,
    paddingHorizontal: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.M,
  },
  imageButton: {
    width: '100%',
    alignSelf: 'stretch',
  },
  image: {
    width: '100%',
    alignSelf: 'stretch',
  },
});

export default memo(FeedDetailContent);