import React, { memo, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { radius } from '../../../shared/styles/token'
import { colors } from '../../styles/color';

import IlProfileWithdrawn from '../../../assets/illustrations/il_profile_withdrawn.svg';
import IlProfileRestricted from '../../../assets/illustrations/il_profile_restricted.svg';

const PROFILE_IMG_SIZE = {
  S: 24,
  M: 32,
  L: 40,
};

const PROFILE_IMG_RADIUS = {
  S: radius.XS,
  M: radius.S,
  // 짧은 변 40이라 기준대로면 M이지만, ListRow 배경(XL) 안에서 덜 둥글게 보이도록 S
  L: radius.S,
};

const ProfileImg = ({
  imageUri,
  size = 'M',
  // 탈퇴한 회원은 사진 대신 탈퇴 회원 이미지로 고정한다
  isWithdrawn = false,
  // 운영정책에 따라 가려진 댓글은 사진 대신 가림 이미지로 고정한다
  isRestricted = false,
  // 사진 대신 이 색으로 채운다 (신고 처리 알림)
  color,
  style,
}) => {
  const [hasError, setHasError] = useState(false);

  const imageSize =
    PROFILE_IMG_SIZE[size] ?? PROFILE_IMG_SIZE.M;
  const imageRadius =
    PROFILE_IMG_RADIUS[size] ?? PROFILE_IMG_RADIUS.M;

  useEffect(() => {
    setHasError(false);
  }, [imageUri]);

  if (isWithdrawn || isRestricted) {
    const Illustration = isRestricted ? IlProfileRestricted : IlProfileWithdrawn;

    return (
      <View
        style={[
          styles.image,
          styles.withdrawn,
          {
            width: imageSize,
            height: imageSize,
            borderRadius: imageRadius,
          },
          style,
        ]}
      >
        <Illustration width="100%" height="100%" />
      </View>
    );
  }

  const imageStyle = [
    styles.image,
    {
      width: imageSize,
      height: imageSize,
      borderRadius: imageRadius,
    },
    style,
  ];

  // 사진이 없거나(로딩 중 포함) 못 불러오면 단색으로 채운다
  if (!imageUri || hasError) {
    return <View style={[styles.empty, imageStyle]} />;
  }

  return (
    <Image
      source={{ uri: imageUri }}
      resizeMode="cover"
      onError={() => setHasError(true)}
      style={imageStyle}
    />
  );
};

const styles = StyleSheet.create({
  image: {
    flexShrink: 0,
  },
  empty: {
    backgroundColor: colors.fillNeutralWeak,
  },
  // SVG 는 borderRadius 로 잘리지 않아 감싼 View 에서 자른다
  withdrawn: {
    overflow: 'hidden',
  },
});

export default memo(ProfileImg);