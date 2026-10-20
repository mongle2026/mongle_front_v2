import React, { memo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Animated from 'react-native-reanimated';

import IcArrowRight from '../../../assets/icons/ic_arrow_right.svg';
import usePressAnimation from '../../hooks/usePressAnimation';
import { colors } from '../../styles/color';
import {
  gap,
  padding,
} from '../../styles/token';
import { typo } from '../../styles/typo';

const SIZE = {
  S: 'S',
  M: 'M',
};

// IconButton size S 와 같은 크기 (아이콘 14 + padding XS)
const ARROW_SIZE = 14;

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
  // 화살표가 있는 M 헤더는 줄 전체를 누를 수 있다 (화살표는 아이콘으로만 보여 준다)
  const isPressable = isMedium && showIconButton;
  // 카드와 같은 눌림 효과 (살짝 작아지며 눌린다)
  const { animatedStyle, pressHandlers } = usePressAnimation({
    onPress: isPressable ? onIconButtonPress : undefined,
  });

  const containerStyle = [
    styles.container,
    isMedium
      ? styles.containerM
      : styles.containerS,
    style,
  ];

  const content = isMedium ? (
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
        <View style={styles.arrow}>
          <IcArrowRight
            width={ARROW_SIZE}
            height={ARROW_SIZE}
            color={colors.fgNeutralQuaternary}
            fill={colors.fgNeutralQuaternary}
          />
        </View>
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
  );

  if (isPressable) {
    return (
      <Pressable
        {...pressHandlers}
        accessibilityRole="button"
        accessibilityLabel={iconButtonAccessibilityLabel ?? title}
      >
        <Animated.View style={[containerStyle, animatedStyle]}>
          {content}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <View
      style={containerStyle}
      accessibilityRole="header"
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      colors.bgSurface,
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
    paddingTop: padding.L,
    paddingBottom: padding.M,
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
    color: colors.fgInfo,
  },

  neutralText: {
    color: colors.fgNeutralSecondary,
  },

  arrow: {
    padding: padding.XS,
    flexShrink: 0,
  },
});

export default memo(ListHeader);