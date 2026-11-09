import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import MusicCoverImg from '../../../../shared/components/atomic/MusicCoverImg';
import { colors } from '../../../../shared/styles/color';
import { radius } from '../../../../shared/styles/token';

/**
 * 봉투에 담기는 내용물 한 장 (보내는 사람 프로필 / 음악 커버 / 첨부 사진).
 * 내용물들은 세로 한 줄로 쌓여 함께 내려오다가, 각 장이 봉투 안 자기 자리(restTop)에
 * 닿으면 그 자리에 멈춘다. 뒤에 오는 장이 앞 장 위에 포개지며 차곡차곡 담기고,
 * 다 담기면 묶음 전체가 sinkOffset 만큼 함께 가라앉고, 덮개가 닫히기 전에 사라진다.
 *
 * @param {'profile' | 'music' | 'photo'} kind
 * @param {object} layout { size, left, top, offsetFromBottom, restTop }
 *   top: 봉투 윗변의 위치(잘라내는 영역 기준)
 *   offsetFromBottom: 줄 아랫변에서 이 장 윗변까지
 *   restTop: 봉투에 담긴 뒤 이 장 윗변의 위치 (봉투 윗변 기준)
 * @param {import('react-native-reanimated').SharedValue<number>} columnBottom
 * @param {import('react-native-reanimated').SharedValue<number>} sinkOffset
 * @param {import('react-native-reanimated').SharedValue<number>} contentOpacity
 */
const SendContentCard = ({ kind, uri, layout, columnBottom, sinkOffset, contentOpacity }) => {
  const { size, left, top, offsetFromBottom, restTop } = layout;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [
      {
        translateY:
          Math.min(columnBottom.value + offsetFromBottom, restTop) + sinkOffset.value,
      },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.card,
        {
          left,
          top,
          width: size,
          height: size,
          borderRadius: kind === 'music' ? radius.XS : radius.XL,
        },
        animatedStyle,
      ]}
    >
      {kind === 'music' ? (
        <MusicCoverImg imageSource={uri ? { uri } : null} size={size} />
      ) : uri ? (
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      ) : (
        // 사진이 없으면 단색으로 채운다
        <View style={[styles.image, styles.empty]} />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  empty: {
    backgroundColor: colors.fillNeutralWeak,
  },
});

export default memo(SendContentCard);
