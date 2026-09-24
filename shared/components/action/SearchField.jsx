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

import { colors } from '../../styles/color';
import { padding, gap, radius } from '../../styles/token';
import { typo } from '../../styles/typo';

import IcSearch from '../../../assets/icons/ic_search.svg';

const DEFAULT_PLACEHOLDER = '편지를 받을 사람을 검색해 주세요.';

const COLLAPSE_DURATION = 200;

/**
 * @param {SharedValue<boolean>} [collapsed] true면 접혀서 사라집니다
 *   (useCollapseOnScroll 참고). 입력값이 있으면 무시하고 항상 펼쳐 둡니다.
 */
const SearchField = ({
  value,
  onChangeText,
  placeholder = DEFAULT_PLACEHOLDER,
  collapsed,
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

  const collapseStyle = useAnimatedStyle(() => {
    if (contentHeight.value === 0) return {};

    return {
      height:
        contentHeight.value *
        expandProgress.value,
    };
  });

  const contentStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value,
    transform: [
      {
        translateY:
          -contentHeight.value *
          (1 - expandProgress.value),
      },
    ],
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
        <View style={styles.searchField}>
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
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  collapse: {
    width: '100%',
    overflow: 'hidden',
  },

  container: {
    width: '100%',
    paddingTop: padding.XL,
    paddingRight: padding.XL,
    paddingBottom: padding.XS,
    paddingLeft: padding.XL,
    flexDirection: 'column',
    alignItems: 'flex-start',
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