import { memo, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../shared/styles/color';
import { typo } from '../../../shared/styles/typo';
import { gap, padding, radius } from '../../../shared/styles/token';

const IMAGE_SIZE = 48;
const BADGE_SIZE = 20;

// Figma 기준 badge 위치(컨테이너 기준 right: 10, top: 24)를
// 이미지 기준으로 옮긴 값. 이름 길이와 상관없이 이미지에 붙어 있도록 한다.
const BADGE_RIGHT = 10 - padding.S;
const BADGE_TOP = 24;

/**
 * 우표를 가진 사람의 프로필 (이미지 + 이름).
 * 나의 프로필(isMe)인 경우에만 이미지 위에 '나' 배지를 띄운다.
 *
 * @param {string} [imageUri]
 * @param {string} name
 * @param {boolean} [isMe]
 */
const Profile = ({ imageUri, name, isMe = false, style }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [imageUri]);

  const showImage = Boolean(imageUri) && !hasError;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.imageArea}>
        {showImage ? (
          <Image
            source={{ uri: imageUri }}
            resizeMode="cover"
            onError={() => setHasError(true)}
            style={styles.image}
          />
        ) : (
          <View style={styles.image} />
        )}

        {isMe && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>나</Text>
          </View>
        )}
      </View>

      <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
        {name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',

    // 이름이 이미지 폭을 넘으면 말줄임 되도록 폭을 이미지 + 좌우 padding으로 고정
    width: IMAGE_SIZE + padding.S * 2,
    paddingHorizontal: padding.S,
    gap: gap.S,
  },

  imageArea: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },

  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: radius.S,
    backgroundColor: colors.fgNeutralFaint,
  },

  badge: {
    position: 'absolute',
    right: BADGE_RIGHT,
    top: BADGE_TOP,

    width: BADGE_SIZE,
    height: BADGE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',

    borderRadius: radius.XL,
    backgroundColor: colors.bgOverlay,
  },

  badgeText: {
    ...typo.suitLabelMediumStrong,
    color: colors.fgNeutralInverted,
    textAlign: 'center',
  },

  name: {
    ...typo.suitLabelMedium,
    alignSelf: 'stretch',
    color: colors.fgNeutralSolid,
    textAlign: 'center',
  },
});

export default memo(Profile);
