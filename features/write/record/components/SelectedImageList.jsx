import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

// Icons
import IcX from '../../../../assets/icons/ic_x.svg';

// Shared Components
import IconButton from '../../../../shared/components/action/IconButton';
import { WriteImg, WRITE_IMG_RATIO } from '../../../../shared/components/atomic/WriteImg';

// Shared Styles
import { colors } from '../../../../shared/styles/color';
import { gap, radius } from '../../../../shared/styles/token';

const getWriteImgRatio = image => {
  const width = image?.width;
  const height = image?.height;

  // 크기 정보를 알 수 없으면 기본 4:3
  if (!width || !height) return WRITE_IMG_RATIO.FOUR_THREE;

  // 세로 사진
  if (height > width) return WRITE_IMG_RATIO.FIVE_SIX;

  // 가로 사진 + 1:1 사진
  return WRITE_IMG_RATIO.FOUR_THREE;
};

const SelectedImageList = ({ images = [], onRemove }) => {
  if (images.length === 0) return null;

  return (
    <View style={styles.container}>
      {images.map((image, index) => {
        const ratio = getWriteImgRatio(image);

        return (
          <View
            key={image.uri ?? `selected-image-${index}`}
            style={styles.imageWrapper}
          >
            <WriteImg
              imageSource={{ uri: image.uri }}
              ratio={ratio}
              pointerEvents="none"
              style={styles.image}
            />

            <IconButton
              size="L"
              icon={IcX}
              color={colors.fgNeutralInverted}
              onPress={() => onRemove?.(image)}
              accessibilityLabel={`첨부 이미지 ${index + 1} 삭제`}
              style={styles.removeButton}
            />
          </View>
        );
      })}
    </View>
  );
};

export default memo(SelectedImageList);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: gap.M,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
  },
  image: {
    width: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderRadius: radius.XS,
    backgroundColor: colors.bgOverlayMuted,
    zIndex: 1,
  },
});