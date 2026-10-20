import React, { memo, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import MusicCoverImg from '../../../shared/components/atomic/MusicCoverImg';

import { padding, radius } from '../../../shared/styles/token';

// 프로필 그리드의 노래 커버 카드. 1:1 비율로 부모 행의 폭을 나눠 쓴다.
// MusicCoverImg(Skia)는 숫자 size가 필요해서 레이아웃 후 측정한 폭을 넘긴다.
const ProfileMusicCard = ({ imageSource, title, style }) => {
  const [cardSize, setCardSize] = useState(0);

  const handleLayout = useCallback(e => {
    setCardSize(e.nativeEvent.layout.width);
  }, []);

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      {cardSize > 0 && (
        <MusicCoverImg
          imageSource={imageSource}
          size={cardSize}
          accessibilityLabel={`${title || '음악'} 앨범 커버`}
          style={styles.cover}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: padding.L,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 0,
    aspectRatio: 1,
    borderRadius: radius.M,
    overflow: 'hidden',
  },
  cover: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default memo(ProfileMusicCard);
