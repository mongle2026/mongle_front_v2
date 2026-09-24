import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  LayoutAnimationConfig,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import IcFilledCheck from '../../../assets/icons/ic_filledcheck.svg';
import IcFilledAlert from '../../../assets/icons/ic_filledalert.svg';

import ButtonText from '../action/ButtonText';

import { colors, shadow } from '../../styles/color';
import { padding, gap, radius } from '../../styles/token';
import { typo } from '../../styles/typo';

const TOAST_ICONS = {
  check: IcFilledCheck,
  alert: IcFilledAlert,
};

// 내용 전환: 이전 내용이 먼저 페이드 아웃되고, 거의 사라진 뒤에 새 내용이 페이드 인된다
const CONTENT_EXIT_DURATION = 120;
const CONTENT_ENTER_DELAY = 80;
const CONTENT_ENTER_DURATION = 200;

const contentEntering = () => {
  'worklet';

  return {
    initialValues: {
      opacity: 0,
    },
    animations: {
      opacity: withDelay(
        CONTENT_ENTER_DELAY,
        withTiming(1, { duration: CONTENT_ENTER_DURATION }),
      ),
    },
  };
};

const contentExiting = () => {
  'worklet';

  return {
    initialValues: {
      opacity: 1,
    },
    animations: {
      opacity: withTiming(0, { duration: CONTENT_EXIT_DURATION }),
    },
  };
};

/**
 * @param {number} [contentKey] 바뀌면 박스는 그대로 두고 텍스트·버튼만 페이드로 전환한다 (아이콘은 바뀔 때만)
 */
const Toast = ({
  contentKey,
  text,
  icon = 'check',
  iconColor = colors.fgPositive,
  buttonText,
  onPressButton,
}) => {
  const Icon = TOAST_ICONS[icon] ?? TOAST_ICONS.check;
  // 아이콘은 모양이나 색이 실제로 바뀔 때만 전환한다
  const iconKey = `${icon}-${iconColor}`;

  return (
    <View style={styles.container}>
      <View style={styles.sectionToast}>
        {/* 토스트 자체가 뜨고 사라질 때는 내용 전환 없이 박스 애니메이션만 보이게 한다 */}
        <LayoutAnimationConfig skipEntering skipExiting>
          <View style={styles.iconSlot}>
            <Animated.View
              key={iconKey}
              entering={contentEntering}
              exiting={contentExiting}
            >
              <Icon
                width={20}
                height={20}
                color={iconColor}
              />
            </Animated.View>
          </View>

          <View style={styles.contentSlot}>
            <Animated.View
              key={contentKey}
              entering={contentEntering}
              exiting={contentExiting}
              style={styles.content}
            >
              <Text
                numberOfLines={1}
                style={styles.text}
              >
                {text}
              </Text>

              {buttonText && onPressButton && (
                <ButtonText
                  text={buttonText}
                  size="ButtonText"
                  onPress={onPressButton}
                />
              )}
            </Animated.View>
          </View>
        </LayoutAnimationConfig>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: padding.M,
    paddingHorizontal: padding.L,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  sectionToast: {
    alignSelf: 'stretch',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: padding.XXS,
    paddingRight: padding.L,
    paddingBottom: padding.XXS,
    paddingLeft: padding.XL,
    gap: gap.M,
    borderRadius: radius.M,
    backgroundColor: colors.bgNeutralInvertedPressed,
    ...shadow.middleDown,
  },
  // 전환 중 이전/새 내용이 같은 자리에 겹치도록 유지되는 영역
  iconSlot: {},
  contentSlot: {
    flex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.M,
  },
  text: {
    flex: 1,
    color: colors.fgNeutralInverted,
    ...typo.suitLabelLargeStrong,
  },
});

export default memo(Toast);
