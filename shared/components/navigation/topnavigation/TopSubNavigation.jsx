import React, { memo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import IconButton from '../../action/IconButton';
import ButtonText from '../../action/ButtonText';

import IcX from '../../../../assets/icons/ic_x.svg';
import IcShare from '../../../../assets/icons/ic_share.svg';
import IcKebab from '../../../../assets/icons/ic_kebab.svg';
import IcChevron from '../../../../assets/icons/ic_chevron.svg';

import { colors } from '../../../styles/color';
import { gap, padding } from '../../../styles/token';
import { typo } from '../../../styles/typo';

// Figma 컴포넌트: navigation/TopSubNavigation (type icon / text)
// 아이콘 버튼은 모두 IconButton L, 아이콘 색 fgNeutralPrimary
const TopSubNavigation = ({
  type = 'icon',

  headerText = '',
  nextText = '다음',

  leftIcon = IcX,
  leftAccessibilityLabel = '닫기',

  onPressClose,
  onPressNext,
  onPressShare,
  onPressMore,
  // type = text. showChevron일 때 제목(텍스트 + chevron)을 누르면 호출
  onPressHeader,

  // type = text. false면 오른쪽 버튼을 숨긴다
  showNext = true,

  // type = text. true면 오른쪽 버튼 자리에 스피너를 보여주고 누를 수 없다
  isNextLoading = false,

  // type = text. 제목 옆 chevron 아이콘 (기본 숨김)
  showChevron = false,

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
            color={colors.fgNeutralPrimary}
            size="L"
            onPress={onPressClose}
            accessibilityLabel={leftAccessibilityLabel}
          />

          {/* chevron이 보일 때만 제목 영역 전체(텍스트 + 아이콘)를 누를 수 있다 */}
          <Pressable
            onPress={onPressHeader}
            disabled={!showChevron}
            accessibilityRole={showChevron ? 'button' : 'header'}
            style={({ pressed }) => [
              styles.headerTextContainer,
              showChevron && pressed && styles.pressed,
            ]}
          >
            <Text
              style={[styles.headerText, textStyle]}
            >
              {headerText}
            </Text>

            {showChevron && (
              <IcChevron
                width={16}
                height={16}
                color={colors.fgNeutralPrimary}
              />
            )}
          </Pressable>

          {showNext ? (
            // 로딩 중에도 버튼 자리를 그대로 두어 제목 위치가 흔들리지 않게 한다
            <View style={styles.nextContainer}>
              <View
                style={isNextLoading && styles.hidden}
                pointerEvents={isNextLoading ? 'none' : 'auto'}
              >
                <ButtonText
                  text={nextText}
                  onPress={onPressNext}
                  textStyle={nextTextStyle}
                />
              </View>

              {isNextLoading && (
                <View style={styles.nextLoading}>
                  <ActivityIndicator color={colors.fgNeutralSecondary} />
                </View>
              )}
            </View>
          ) : (
            // 제목이 가운데에 오도록 왼쪽 아이콘과 같은 크기의 빈 자리를 둔다
            <View
              style={styles.hidden}
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <IconButton icon={leftIcon} size="L" />
            </View>
          )}
        </View>
      ) : (
        <>
          <IconButton
            icon={leftIcon}
            color={colors.fgNeutralPrimary}
            size="L"
            onPress={onPressClose}
            accessibilityLabel={leftAccessibilityLabel}
          />

          <View style={styles.tail}>
            {showShare && (
              <IconButton
                icon={IcShare}
                color={colors.fgNeutralPrimary}
                size="L"
                onPress={onPressShare}
                accessibilityLabel="공유하기"
              />
            )}

            {showMore && (
              <IconButton
                icon={IcKebab}
                color={colors.fgNeutralPrimary}
                size="L"
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
    paddingVertical: padding.XS,

    flexDirection: 'row',

    backgroundColor: colors.bgSurface,
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

  // Figma: tail 안에서 세로 가운데 정렬
  nextContainer: {
    alignSelf: 'center',
  },

  nextLoading: {
    ...StyleSheet.absoluteFill,

    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTextContainer: {
    paddingVertical: padding.S,

    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.S,
  },

  pressed: {
    opacity: 0.6,
  },

  headerText: {
    ...typo.suitLabelXLargeStrong,

    color: colors.fgNeutralPrimary,
    textAlign: 'center',
  },
});

export default memo(TopSubNavigation);