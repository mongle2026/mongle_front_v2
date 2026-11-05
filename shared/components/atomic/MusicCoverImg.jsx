import React, { memo, } from 'react';
import { Image, StyleSheet, View, } from 'react-native';

import { radius, } from '../../styles/token';

export const MUSIC_COVER_SIZES =
  Object.freeze({
    M: 72,
  });

const resolveMusicCoverSize = size => {
  if (
    typeof size === 'number' &&
    Number.isFinite(size) &&
    size > 0
  ) {
    return size;
  }

  return (
    MUSIC_COVER_SIZES[size] ??
    MUSIC_COVER_SIZES.M
  );
};

// 앨범 커버는 효과 없이 원본 이미지를 그대로 보여준다
const MusicCoverImg = ({
  imageSource,
  size = 'M',
  // 앨범 커버는 크기와 상관없이 XS. 카드를 꽉 채울 때만 카드 라운딩을 넘긴다
  borderRadius = radius.XS,
  style,
  accessibilityLabel = '앨범 커버',
}) => {
  const currentSize =
    resolveMusicCoverSize(size);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        accessibilityLabel
      }
      style={[
        styles.container,
        style,
        {
          width: currentSize,
          height: currentSize,
          borderRadius,
        },
      ]}
    >
      {imageSource && (
        <Image
          source={imageSource}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexShrink: 0,
    overflow: 'hidden',
  },
});

export default memo(MusicCoverImg);
