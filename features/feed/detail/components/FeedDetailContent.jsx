import React, { memo, useCallback, useMemo } from 'react';
import { Keyboard, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { WriteImg, WRITE_IMG_EFFECT } from '../../../../shared/components/atomic/WriteImg';
import FontFallbackText from '../../../../shared/components/atomic/FontFallbackText';

import useWriteImgRatio from '../../../../shared/hooks/useWriteImgRatio';

import { colors } from '../../../../shared/styles/color';
import { getImageKey } from '../../../../shared/utils/media';
import { FONT, getBodyFontStyle } from '../../../../shared/styles/fontType';
import { gap, padding } from '../../../../shared/styles/token';

// http/https로 시작하는 URL 감지
const URL_PATTERN = /https?:\/\/[^\s​-‍﻿]+/g;

// 텍스트를 일반 텍스트 세그먼트와 URL 세그먼트로 분리
const parseUrlSegments = text => {
  const segments = [];
  let lastIndex = 0;

  const regex = new RegExp(URL_PATTERN.source, 'g');
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'url', text: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', text: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', text }];
};

// URL 을 하이퍼링크로 보여주는 본문 텍스트 컴포넌트
const ContentText = memo(({ content, style }) => {
  const segments = useMemo(() => parseUrlSegments(content), [content]);
  const hasLinks = segments.some(s => s.type === 'url');

  const handlePressLink = useCallback(url => {
    Linking.openURL(url).catch(() => {/* 열기 실패 시 무시 */});
  }, []);

  if (!hasLinks) {
    return (
      <FontFallbackText style={style}>
        {content}
      </FontFallbackText>
    );
  }

  return (
    <Text style={style}>
      {segments.map((segment, index) =>
        segment.type === 'url' ? (
          <Text
            key={index}
            style={[style, styles.linkText]}
            onPress={() => handlePressLink(segment.text)}
          >
            {segment.text}
          </Text>
        ) : (
          <FontFallbackText key={index} style={style}>
            {segment.text}
          </FontFallbackText>
        )
      )}
    </Text>
  );
});

const DETAIL_CONTENT_MIN_HEIGHT = 418;

// 가로 사진 4:3, 세로 사진 5:6
// 피드 홈과 같은 필름 보정. 사진을 눌러 크게 볼 때(ImageViewer)는 원본
const DetailImage = ({ imageSource, onPress }) => {
  const ratio = useWriteImgRatio(imageSource);

  return (
    <Pressable onPress={onPress} style={styles.imageButton}>
      <WriteImg
        imageSource={imageSource}
        ratio={ratio}
        effect={WRITE_IMG_EFFECT.FILM}
        pointerEvents="none"
        style={styles.image}
      />
    </Pressable>
  );
};

const FeedDetailContent = ({
  content = '',
  imageSources = [],
  font = FONT.KYOBO,
  onPress,
  onPressImage,
}) => {
  const hasContent = typeof content === 'string' && content.trim().length > 0;
  const visibleImages = imageSources.filter(Boolean);
  const fontStyle = getBodyFontStyle(font);

  const handlePress = useCallback(() => {
    Keyboard.dismiss();
    onPress?.();
  }, [onPress]);

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      {hasContent && (
        <View style={styles.textContainer}>
          <ContentText
            content={content}
            style={[styles.contentText, fontStyle]}
          />
        </View>
      )}

      {visibleImages.length > 0 && (
        <View style={styles.imgContainer}>
          {visibleImages.map((imageSource, index) => (
            <DetailImage
              key={getImageKey(imageSource, index)}
              imageSource={imageSource}
              onPress={() => onPressImage?.(imageSource, index)}
            />
          ))}
        </View>
      )}
    </Pressable>
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
    color: colors.fgNeutralSecondary,
    textAlign: 'justify',
  },

  linkText: {
    color: colors.fgInfo,
    textDecorationLine: 'underline',
  },

  imgContainer: {
    width: '100%',
    paddingTop: padding.M,
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