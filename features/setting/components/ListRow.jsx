import React, { memo } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import ToggleButton from './ToggleButton';

import IcArrowRight from '../../../assets/icons/ic_arrow_right.svg';
import { colors } from '../../../shared/styles/color';
import { gap, padding } from '../../../shared/styles/token';
import { typo } from '../../../shared/styles/typo';

const ARROW_SIZE = 16;

// 설정 화면용 행. 왼쪽에 text/caption, 오른쪽에 subtext / 화살표 / 토글을 골라서 둔다
// 오른쪽 요소는 모두 기본 숨김이라 필요한 것만 show* 로 켠다
const ListRow = ({
  text,
  caption,

  // 오른쪽 정렬 보조 텍스트 (한 줄, 넘치면 말줄임)
  showSubtext = false,
  subtext,

  // 화살표를 켜면 행 전체를 누를 수 있다
  showArrow = false,
  arrowIcon: ArrowIcon = IcArrowRight,
  onPress,

  showToggle = false,
  toggleActive = false,
  toggleDisabled = false,
  onTogglePress,

  // 행 전체 비활성. text/caption을 흐리게 하고 토글은 현재 상태를 유지한 채 막는다
  disabled = false,

  style,
}) => {
  const content = (
    <>
      <View style={styles.textContainer}>
        {text ? (
          <Text style={[styles.text, disabled && styles.disabledText]}>
            {text}
          </Text>
        ) : null}

        {caption ? (
          <Text style={[styles.caption, disabled && styles.disabledText]}>
            {caption}
          </Text>
        ) : null}
      </View>

      {/* subtext를 숨겨도 남는 폭을 채워 오른쪽 요소를 끝으로 민다 */}
      <View style={styles.subtext}>
        {showSubtext && subtext ? (
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.subtextText}
          >
            {subtext}
          </Text>
        ) : null}
      </View>

      {showArrow ? (
        <ArrowIcon
          width={ARROW_SIZE}
          height={ARROW_SIZE}
          color={colors.fgNeutralPrimary}
          fill={colors.fgNeutralPrimary}
          style={styles.arrow}
        />
      ) : null}

      {showToggle ? (
        <ToggleButton
          active={toggleActive}
          disabled={toggleDisabled || disabled}
          onPress={onTogglePress}
          accessibilityLabel={text}
        />
      ) : null}
    </>
  );

  if (showArrow) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={text}
        onPress={onPress}
        style={[styles.container, style]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 56,
    padding: padding.XL,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  textContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: gap.XS,
  },

  text: {
    ...typo.suitLabelXLargeStrong,
    color: colors.fgNeutralPrimary,
  },

  caption: {
    ...typo.suitLabelMedium,
    color: colors.fgNeutralTertiary,
  },

  disabledText: {
    color: colors.fgDisabled,
  },

  subtext: {
    paddingLeft: padding.M,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 0,
  },

  subtextText: {
    ...typo.suitLabelLarge,
    flex: 1,
    overflow: 'hidden',
    textAlign: 'right',
    color: colors.fgNeutralTertiary,
  },

  arrow: {
    flexShrink: 0,
  },
});

export default memo(ListRow);
