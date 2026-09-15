import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

// Icons
import IcX from '../../../../assets/icons/ic_x.svg';

// Shared Components
import IconButton from '../../../../shared/components/action/IconButton';
import { WriteImg, getWriteImgRatio } from '../../../../shared/components/atomic/WriteImg';

// Shared Styles
import { colors } from '../../../../shared/styles/color';
import { gap, radius } from '../../../../shared/styles/token';

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