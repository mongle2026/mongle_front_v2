import React, { memo, useEffect, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import { radius } from '../../../shared/styles/token'

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
}) => {
  const [hasError, setHasError] = useState(false);

  const imageSize =
    PROFILE_IMG_SIZE[size] ?? PROFILE_IMG_SIZE.M;

  useEffect(() => {
    setHasError(false);
  }, [imageUri]);

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
      ]}
    />
  );
};

const styles = StyleSheet.create({
  image: {
    flexShrink: 0,
    borderRadius: radius.XS,
  },
});

export default memo(ProfileImg);