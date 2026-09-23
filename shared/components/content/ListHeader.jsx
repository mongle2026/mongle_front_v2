import React, { memo } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import IcArrowRight from '../../../assets/icons/ic_arrow_right.svg';
import { colors } from '../../styles/color';
import {
  gap,
  padding,
} from '../../styles/token';
import { typo } from '../../styles/typo';

import IconButton from '../action/IconButton';

const SIZE = {
  S: 'S',
  M: 'M',
};

const ListHeader = ({
  size = SIZE.S,
  title,
  informativeText,
  showIconButton = false,
  onIconButtonPress,
  iconButtonAccessibilityLabel,
  style,
  textStyle,
  informativeTextStyle,
}) => {
  const isMedium = size === SIZE.M;

  return (
    <View
      style={[
        styles.container,
        isMedium
          ? styles.containerM
          : styles.containerS,
        style,
      ]}
      accessibilityRole="header"
    >
      {isMedium ? (
        <>
          {informativeText ? (
            <Text
              style={[
                styles.titleM,
                styles.informativeText,
                informativeTextStyle,
              ]}
            >
              {informativeText}
            </Text>
          ) : null}

          <Text
            style={[
              styles.titleM,
              styles.titleMFill,
              styles.neutralText,
              textStyle,
            ]}
          >
            {title}
          </Text>

          {showIconButton ? (
            <IconButton
              icon={IcArrowRight}
              size="S"
              color={colors.fgNeutralWeak}
              onPress={onIconButtonPress}
              accessibilityLabel={
                iconButtonAccessibilityLabel
              }
            />
          ) : null}
        </>
      ) : (
        <Text
          style={[
            styles.titleS,
            styles.neutralText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      colors.bgLayerDefault,
  },

  // size = S
  containerS: {
    paddingVertical: padding.M,
    paddingHorizontal: padding.XL,
    gap: padding.XXS,
  },

  titleS: {
    ...typo.suitTitleSmallStrong,
    flex: 1,
    textAlign: 'justify',
  },

  // size = M
  containerM: {
    paddingVertical: padding.L,
    paddingHorizontal: padding.XL,
    gap: gap.XS,
  },

  titleM: {
    ...typo.suitTitleMediumStrong,
    textAlign: 'justify',
  },

  titleMFill: {
    flex: 1,
  },

  informativeText: {
    color: colors.fgInformative,
  },

  neutralText: {
    color: colors.fgNeutralMuted,
  },
});

export default memo(ListHeader);