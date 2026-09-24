import React from 'react';
import {
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../../styles/color';
import { padding, gap, radius } from '../../styles/token';
import { typo } from '../../styles/typo';

import IcSearch from '../../../assets/icons/ic_search.svg';

const DEFAULT_PLACEHOLDER = '편지를 받을 사람을 검색해 주세요.';

const COLLAPSE_DURATION = 200;

// 하단 그라데이션 높이. 아래 목록이 이 높이만큼 SearchField 밑으로 들어와야 그라데이션이 보인다
export const SEARCH_FIELD_BOTTOM_FADE_HEIGHT = padding.XL;

/**
 * @param {SharedValue<boolean>} [collapsed] true면 검색창이 접혀서 하단 그라데이션만 남습니다
 *   (useCollapseOnScroll 참고). 입력값이 있으면 무시하고 항상 펼쳐 둡니다.
 * @param {string} [backgroundColor] 검색창 뒤 배경과 하단 그라데이션 색.
 *   그라데이션은 위 불투명(100%) → 아래 투명(0%).
 *   #rrggbb 형식이어야 합니다 (뒤에 00을 붙여 투명색을 만듭니다).
 */
const SearchField = ({
  value,
  onChangeText,
  placeholder = DEFAULT_PLACEHOLDER,
  collapsed,
  backgroundColor = colors.bgLayerDefault,
  ...textInputProps
}) => {
  const hasValue = value?.length > 0;

  // 접을 때 줄일 원래 높이. 측정 전(0)에는 높이를 건드리지 않습니다.
  const contentHeight = useSharedValue(0);

  const expandProgress = useDerivedValue(() => {
    const isCollapsed =
      !hasValue && !!collapsed?.value;

    return withTiming(isCollapsed ? 0 : 1, {
      duration: COLLAPSE_DURATION,
    });
  }, [hasValue, collapsed]);

  // 접혀도 하단 그라데이션 높이만큼은 남겨 둡니다.
  const collapseStyle = useAnimatedStyle(() => {
    if (contentHeight.value === 0) return {};

    const collapsibleHeight =
      contentHeight.value -
      SEARCH_FIELD_BOTTOM_FADE_HEIGHT;

    return {
      height:
        SEARCH_FIELD_BOTTOM_FADE_HEIGHT +
        collapsibleHeight * expandProgress.value,
    };
  });

  const contentStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          -(contentHeight.value -
            SEARCH_FIELD_BOTTOM_FADE_HEIGHT) *
          (1 - expandProgress.value),
      },
    ],
  }));

  const searchFieldStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value,
  }));

  const foregroundColor = hasValue
    ? colors.fgNeutralSolid
    : colors.fgPlaceholder;

  return (
    <Animated.View style={[styles.collapse, collapseStyle]}>
      <Animated.View
        style={[styles.container, contentStyle]}
        onLayout={event => {
          contentHeight.value =
            event.nativeEvent.layout.height;
        }}
      >
        {/* 검색창 영역은 단색, 하단 패딩 영역은 배경색 → 투명 그라데이션 */}
        <View
          style={[styles.background, { backgroundColor }]}
        />

        <LinearGradient
          pointerEvents="none"
          colors={[backgroundColor, `${backgroundColor}00`]}
          style={styles.bottomFade}
        />

        <Animated.View
          style={[styles.searchField, searchFieldStyle]}
        >
          <IcSearch
            width={20}
            height={20}
            color={foregroundColor}
          />

          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.fgPlaceholder}
            style={styles.input}
            {...textInputProps}
          />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // 아래 목록이 그라데이션 밑으로 들어오므로 목록보다 위에 그립니다.
  collapse: {
    width: '100%',
    overflow: 'hidden',
    zIndex: 1,
  },

  container: {
    width: '100%',
    padding: padding.XL,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },

  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: SEARCH_FIELD_BOTTOM_FADE_HEIGHT,
  },

  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SEARCH_FIELD_BOTTOM_FADE_HEIGHT,
  },

  searchField: {
    width: '100%',
    paddingVertical: padding.L,
    paddingHorizontal: padding.XL,
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.M,
    borderRadius: radius.S,
    backgroundColor: colors.bgLayerBasement,
  },

  input: {
    flex: 1,
    padding: 0,
    color: colors.fgNeutralSolid,
    ...typo.suitLabelXLarge,
  },
});

export default SearchField;
