import React, { memo, useCallback, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import IconButton from '../../../../shared/components/action/IconButton';

import IcArrowUp from '../../../../assets/icons/ic_arrowup.svg';

import { colors } from '../../../../shared/styles/color';

// IconButton size M 의 아이콘 크기와 같게 그린다
const ICON_SIZE = 18;

// 글을 쓰기 시작하면 회색 화살표가 검정으로 서서히 바뀐다
const ENABLE_TIMING = { duration: 180, easing: Easing.out(Easing.quad) };

// 전송: 화살표가 위로 날아가며 사라지고, 아래에서 다시 올라와 제자리에 앉는다
const LAUNCH_DISTANCE = 12;
const LAUNCH_TIMING = { duration: 140, easing: Easing.in(Easing.quad) };
const RETURN_SPRING = { damping: 14, stiffness: 220 };

const playSendHaptic = () => {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
    /* 햅틱을 지원하지 않는 환경에서도 전송은 그대로 동작한다 */
  });
};

/**
 * 댓글 입력바의 전송(↑) 버튼.
 * 비활성 ↔ 활성 색이 부드럽게 바뀌고, 누르면 화살표가 위로 날아갔다 돌아오며 전송된다.
 */
const CommentSendButton = ({
  disabled = false,
  onPress,
  accessibilityLabel = '댓글 등록',
}) => {
  const enabledProgress = useSharedValue(disabled ? 0 : 1);
  const launchY = useSharedValue(0);
  const launchOpacity = useSharedValue(1);

  useEffect(() => {
    enabledProgress.value = withTiming(disabled ? 0 : 1, ENABLE_TIMING);
  }, [disabled, enabledProgress]);

  const arrowStyle = useAnimatedStyle(() => ({
    opacity: launchOpacity.value,
    transform: [{ translateY: launchY.value }],
  }));

  // 회색 · 검정 화살표를 겹쳐 두고 검정 쪽 투명도만 바꿔 색이 바뀌는 것처럼 보이게 한다
  const activeArrowStyle = useAnimatedStyle(() => ({
    opacity: enabledProgress.value,
  }));

  const handlePress = useCallback(() => {
    if (disabled) return;

    playSendHaptic();

    launchY.value = withSequence(
      withTiming(-LAUNCH_DISTANCE, LAUNCH_TIMING),
      withTiming(LAUNCH_DISTANCE, { duration: 0 }),
      withSpring(0, RETURN_SPRING),
    );
    launchOpacity.value = withSequence(
      withTiming(0, LAUNCH_TIMING),
      withTiming(0, { duration: 0 }),
      withTiming(1, { duration: 200 }),
    );

    onPress?.();
  }, [disabled, launchOpacity, launchY, onPress]);

  return (
    <IconButton
      size="M"
      icon={
        <Animated.View style={[styles.arrow, arrowStyle]}>
          <IcArrowUp
            width={ICON_SIZE}
            height={ICON_SIZE}
            color={colors.fgDisabled}
            fill={colors.fgDisabled}
          />

          <Animated.View style={[StyleSheet.absoluteFill, activeArrowStyle]}>
            <IcArrowUp
              width={ICON_SIZE}
              height={ICON_SIZE}
              color={colors.fgNeutralPrimary}
              fill={colors.fgNeutralPrimary}
            />
          </Animated.View>
        </Animated.View>
      }
      onPress={handlePress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
    />
  );
};

const styles = StyleSheet.create({
  arrow: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
});

export default memo(CommentSendButton);
