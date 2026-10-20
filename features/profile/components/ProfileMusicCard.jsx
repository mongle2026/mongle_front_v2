import React, { memo, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import MusicCoverImg from '../../../shared/components/atomic/MusicCoverImg';

import { padding, radius } from '../../../shared/styles/token';

// 프로필 그리드의 노래 커버 카드. 1:1 비율로 부모 행의 폭을 나눠 쓴다.
// MusicCoverImg(Skia)는 숫자 size가 필요해서 레이아웃 후 측정한 폭을 넘긴다.
// children 은 커버 위에 올라간다 (게시글 편집의 체크 · 이동 버튼)
const ProfileMusicCard = ({ imageSource, title, style, children }) => {
  const [cardSize, setCardSize] = useState(0);

  const handleLayout = useCallback(e => {
    setCardSize(e.nativeEvent.layout.width);
  }, []);

  return (
    <View style={[styles.container, style]}>
      {/* border 안쪽 영역을 재서 테두리가 있어도 커버가 테두리를 덮지 않게 한다 */}
      <View style={StyleSheet.absoluteFill} onLayout={handleLayout}>
        {cardSize > 0 && (
          <MusicCoverImg
            imageSource={imageSource}
            size={cardSize}
            accessibilityLabel={`${title || '음악'} 앨범 커버`}
          />
        )}
      </View>

      {children}
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
});

/**
 * 마지막 줄이 한 개뿐일 때 옆을 채우는 빈 칸.
 * 카드는 padding 때문에 flexBasis 가 0 이 아니라 padding 합으로 잡히므로,
 * 빈 칸도 카드와 같은 스타일을 써야 남는 폭을 똑같이 나눠 반 폭이 된다
 */
export const ProfileMusicCardSpacer = () => <View style={styles.container} />;

export default memo(ProfileMusicCard);
