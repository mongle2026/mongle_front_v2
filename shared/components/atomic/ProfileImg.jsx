import React, { memo, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { radius } from '../../../shared/styles/token'

import IlProfileWithdrawn from '../../../assets/illustrations/il_profile_withdrawn.svg';

const DEFAULT_PROFILE_IMAGE = require(
  '../../../assets/write/profile_img.png'
);

const PROFILE_IMG_SIZE = {
  S: 24,
  M: 32,
  L: 40,
};

const ProfileImg = ({
  imageUri,
  size = 'M',
  // 탈퇴한 회원은 사진 대신 탈퇴 회원 이미지로 고정한다
  isWithdrawn = false,
  style,
}) => {
  const [hasError, setHasError] = useState(false);

  const imageSize =
    PROFILE_IMG_SIZE[size] ?? PROFILE_IMG_SIZE.M;

  useEffect(() => {
    setHasError(false);
  }, [imageUri]);

  if (isWithdrawn) {
    return (
      <View
        style={[
          styles.image,
          styles.withdrawn,
          {
            width: imageSize,
            height: imageSize,
          },
          style,
        ]}
      >
        <IlProfileWithdrawn width="100%" height="100%" />
      </View>
    );
  }

  const currentImageSource =
    imageUri && !hasError
      ? { uri: imageUri }
      : DEFAULT_PROFILE_IMAGE;

  return (
    <Image
      source={currentImageSource}
      resizeMode="cover"
      onError={() => setHasError(true)}
      style={[
        styles.image,
        {
          width: imageSize,
          height: imageSize,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  image: {
    flexShrink: 0,
    borderRadius: radius.XS,
  },
  // SVG 는 borderRadius 로 잘리지 않아 감싼 View 에서 자른다
  withdrawn: {
    overflow: 'hidden',
  },
});

export default memo(ProfileImg);