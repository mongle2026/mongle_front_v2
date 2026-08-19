import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import IconButton from '../../action/IconButton';
import ButtonText from '../../action/ButtonText';

import IcX from '../../../../assets/icons/ic_x.svg';
import IcShare from '../../../../assets/icons/ic_share.svg';
import IcKebab from '../../../../assets/icons/ic_kebab.svg';

import { colors } from '../../../styles/color';
import { padding } from '../../../styles/token';
import { typo } from '../../../styles/typo';

const ICON_SIZE = 18;

const TopIconNavigation = ({
  type = 'icon',

  headerText = '',

  onPressClose,
  onPressNext,
  onPressShare,
  onPressMore,

  style,
  textStyle,
}) => {
  const isText = type === 'text';

  return (
    <View
      style={[
        styles.container,
        isText ? styles.containerText : styles.containerIcon,
        style,
      ]}
    >
      {isText ? (
        <View style={styles.textContent}>
          <IconButton
            icon={
              <IcX
                width={ICON_SIZE}
                height={ICON_SIZE}
                color={colors.fgBrand}
              />
            }
            size="M"
            onPress={onPressClose}
            accessibilityLabel="닫기"
          />

          <Text
            allowFontScaling={false}
            style={[styles.headerText, textStyle]}
          >
            {headerText}
          </Text>

          <ButtonText
            text="다음"
            size="ButtonText"
            onPress={onPressNext}
          />
        </View>
      ) : (
        <>
          <IconButton
            icon={
              <IcX
                width={ICON_SIZE}
                height={ICON_SIZE}
                color={colors.fgBrand}
              />
            }
            size="M"
            onPress={onPressClose}
            accessibilityLabel="닫기"
          />

          <View style={styles.tail}>
            <IconButton
              icon={
                <IcShare
                  width={ICON_SIZE}
                  height={ICON_SIZE}
                  color={colors.fgBrand}
                />
              }
              size="M"
              onPress={onPressShare}
              accessibilityLabel="공유하기"
            />

            <IconButton
              icon={
                <IcKebab
                  width={ICON_SIZE}
                  height={ICON_SIZE}
                  color={colors.fgBrand}
                />
              }
              size="M"
              onPress={onPressMore}
              accessibilityLabel="더보기"
            />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',

    paddingHorizontal: padding.L,
    paddingBottom: padding.XS,

    flexDirection: 'row',
  },

  // type = icon
  containerIcon: {
    alignItems: 'center',
    backgroundColor: colors.bgLayerDefault,
  },

  tail: {
    flex: 1,

    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  // type = text
  containerText: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',

    backgroundColor: colors.bgLayerCanvas,
  },

  textContent: {
    flex: 1,
    alignSelf: 'stretch',

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerText: {
    ...typo.suitLabelXLargeStrong,

    color: '#000',
    textAlign: 'center',
  },
});

export default memo(TopIconNavigation);