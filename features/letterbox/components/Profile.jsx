import { memo, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
// 우표 상세 BottomSheet 의 gesture-handler ScrollView 안에서 쓰여서 시트 제스처와 함께 동작하도록 gesture-handler 것을 쓴다
import { Pressable } from 'react-native-gesture-handler';

import IlProfileWithdrawn from '../../../assets/illustrations/il_profile_withdrawn.svg';

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
 * @param {boolean} [isWithdrawn] 탈퇴한 회원이면 사진 대신 탈퇴 회원 이미지로 고정한다
 * @param {() => void} [onPress] 누르면 그 사람 프로필로 이동
 */
const Profile = ({ imageUri, name, isMe = false, isWithdrawn = false, onPress, style }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [imageUri]);

  const showImage = Boolean(imageUri) && !hasError;

  const Container = onPress ? Pressable : View;
  const containerProps = onPress
    ? { onPress, accessibilityRole: 'button', accessibilityLabel: `${name} 프로필 보기` }
    : null;

  return (
    <Container {...containerProps} style={[styles.container, style]}>
      <View style={styles.imageArea}>
        {isWithdrawn ? (
          // SVG 는 borderRadius 로 잘리지 않아 감싼 View 에서 자른다
          <View style={[styles.image, styles.withdrawnImage]}>
            <IlProfileWithdrawn width={IMAGE_SIZE} height={IMAGE_SIZE} />
          </View>
        ) : showImage ? (
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
    </Container>
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
    backgroundColor: colors.fillNeutralWeak,
  },

  withdrawnImage: {
    overflow: 'hidden',
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
    backgroundColor: colors.bgDimmedStrong,
  },

  badgeText: {
    ...typo.suitLabelMediumStrong,
    color: colors.fgNeutralInverted,
    textAlign: 'center',
  },

  name: {
    ...typo.suitLabelMedium,
    alignSelf: 'stretch',
    color: colors.fgNeutralPrimary,
    textAlign: 'center',
  },
});

export default memo(Profile);
