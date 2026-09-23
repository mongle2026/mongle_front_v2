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

const TopIconNavigation = ({
  type = 'icon',

  headerText = '',
  nextText = '다음',

  leftIcon = IcX,
  leftAccessibilityLabel = '닫기',

  onPressClose,
  onPressNext,
  onPressShare,
  onPressMore,

  // type = text. false면 오른쪽 버튼을 숨긴다
  showNext = true,

  // type = icon
  showShare = true,
  showMore = true,

  style,
  textStyle,
  nextTextStyle,
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
            icon={leftIcon}
            color={colors.fgNeutralMuted}
            size="M"
            onPress={onPressClose}
            accessibilityLabel={leftAccessibilityLabel}
          />

          <Text
            style={[styles.headerText, textStyle]}
          >
            {headerText}
          </Text>

          {showNext ? (
            <ButtonText
              text={nextText}
              size="ButtonText"
              onPress={onPressNext}
              textStyle={nextTextStyle}
            />
          ) : (
            // 제목이 가운데에 오도록 왼쪽 아이콘과 같은 크기의 빈 자리를 둔다
            <View
              style={styles.hidden}
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <IconButton icon={leftIcon} size="M" />
            </View>
          )}
        </View>
      ) : (
        <>
          <IconButton
            icon={IcX}
            color={colors.fgNeutralMuted}
            size="M"
            onPress={onPressClose}
            accessibilityLabel="닫기"
          />

          <View style={styles.tail}>
            {showShare && (
              <IconButton
                icon={IcShare}
                color={colors.fgNeutralSolid}
                size="XL"
                onPress={onPressShare}
                accessibilityLabel="공유하기"
              />
            )}

            {showMore && (
              <IconButton
                icon={IcKebab}
                color={colors.fgNeutralSolid}
                size="XL"
                onPress={onPressMore}
                accessibilityLabel="더보기"
              />
            )}
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

    backgroundColor: colors.bgLayerDefault,
  },

  // type = icon
  containerIcon: {
    alignItems: 'center',
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
  },

  textContent: {
    flex: 1,
    alignSelf: 'stretch',

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  hidden: {
    opacity: 0,
  },

  headerText: {
    ...typo.suitLabelXLargeStrong,

    color: colors.fgNeutralSolid,
    textAlign: 'center',
  },
});

export default memo(TopIconNavigation);