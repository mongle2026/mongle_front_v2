import React, { memo, useCallback, useMemo } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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

/*
 * iOS 본문 텍스트.
 * iOS 의 <Text selectable> 은 길게 누르면 '전체 복사' 메뉴만 떠서 원하는 부분만 고를 수 없다.
 * 그래서 읽기 전용 TextInput(UITextView)으로 그려 OS 기본 범위 선택 · 복사를 쓴다.
 * 링크는 UITextView 의 링크 감지(dataDetectorTypes)가 눌렀을 때 열어 주고,
 * 링크 색이 tintColor(= selectionColor)를 따르므로 링크 색과 맞춘다.
 */
const IosContentText = ({ segments, style }) => (
  <TextInput
    multiline
    editable={false}
    scrollEnabled={false}
    dataDetectorTypes="link"
    selectionColor={colors.fgInfo}
    style={[style, styles.iosReadOnlyInput]}
  >
    {segments.map((segment, index) =>
      segment.type === 'url' ? (
        <Text key={index} style={[style, styles.linkText]}>
          {segment.text}
        </Text>
      ) : (
        <FontFallbackText key={index} style={style}>
          {segment.text}
        </FontFallbackText>
      )
    )}
  </TextInput>
);

// URL 을 하이퍼링크로 보여주는 본문 텍스트 컴포넌트 (길게 눌러 원하는 부분을 골라 복사할 수 있다)
const ContentText = memo(({ content, style }) => {
  const segments = useMemo(() => parseUrlSegments(content), [content]);
  const hasLinks = segments.some(s => s.type === 'url');

  const handlePressLink = useCallback(url => {
    Linking.openURL(url).catch(() => {/* 열기 실패 시 무시 */});
  }, []);

  if (Platform.OS === 'ios') {
    return <IosContentText segments={segments} style={style} />;
  }

  // Android 는 <Text selectable> 이 OS 기본 범위 선택 · 복사를 지원한다
  if (!hasLinks) {
    return (
      <FontFallbackText selectable style={style}>
        {content}
      </FontFallbackText>
    );
  }

  return (
    <Text selectable style={style}>
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
  onPressImage,
}) => {
  const hasContent = typeof content === 'string' && content.trim().length > 0;
  const visibleImages = imageSources.filter(Boolean);
  const fontStyle = getBodyFontStyle(font);

  return (
    <View style={styles.container}>
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
    color: colors.fgNeutralSecondary,
    textAlign: 'justify',
  },

  linkText: {
    color: colors.fgInfo,
    textDecorationLine: 'underline',
  },

  // multiline TextInput 의 기본 위쪽 여백(5)을 없애 Text 와 같은 자리에 그린다
  iosReadOnlyInput: {
    padding: 0,
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