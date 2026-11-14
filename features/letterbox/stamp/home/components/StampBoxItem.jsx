import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../../../shared/styles/color';
import { typo } from '../../../../../shared/styles/typo';
import { padding, radius } from '../../../../../shared/styles/token';
import { findStampBoxImage } from '../../../../../shared/data/stampImageData';

import Stamp, { getStampHeight } from '../../../../../shared/components/content/Stamp';

const COUNT_BADGE_SIZE = 20;
// 우표 기준 아래/오른쪽에서 띄우는 거리
const COUNT_BADGE_OFFSET = 8;

/**
 * 편지함 우표 탭의 우표 한 칸.
 * 받아본 적 없는 우표(count 0)는 흐린 회색으로, 받은 우표는 원래 색 + 받은 횟수 배지로 보여준다.
 *
 * @param {string} stampCode 예: 's10'
 * @param {number} count 이 우표가 붙은 편지를 받은 횟수
 * @param {number} width 우표 폭 (높이는 Stamp 비율로 계산)
 * @param {(stampCode: string) => void} [onPress] 받은 우표만 눌린다
 */
const StampBoxItem = ({ stampCode, count = 0, width, onPress }) => {
  const isCollected = count > 0;
  // 우표함은 탭에 들어갈 때마다 전체를 새로 그려서 SVG 대신 미리 뽑아 둔 PNG 를 쓴다. PNG 가 없는 우표만 SVG 로 그린다
  const stampImage = findStampBoxImage(stampCode, isCollected);

  return (
    <Pressable disabled={!isCollected} onPress={() => onPress?.(stampCode)}>
      {stampImage ? (
        <Image
          source={stampImage}
          style={{ width, height: getStampHeight(width) }}
          resizeMode="cover"
        />
      ) : (
        <Stamp stampCode={stampCode} width={width} grayscale={!isCollected} />
      )}

      {isCollected && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  countBadge: {
    position: 'absolute',
    right: COUNT_BADGE_OFFSET,
    bottom: COUNT_BADGE_OFFSET,

    // 숫자가 길어지면 좌우 padding 만큼 같이 늘어난다 (한 자리일 때 20x20)
    minWidth: COUNT_BADGE_SIZE,
    height: COUNT_BADGE_SIZE,
    paddingHorizontal: padding.S,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',

    borderRadius: radius[999],
    backgroundColor: colors.bgDimmedStrong,
  },

  countText: {
    ...typo.suitCaptionMedium600,
    color: colors.fgNeutralInverted,
    textAlign: 'center',
  },
});

export default memo(StampBoxItem);
