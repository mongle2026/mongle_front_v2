import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, palette } from '../../../../shared/styles/color';
import { radius } from '../../../../shared/styles/token';
import BookmarkStroke from '../../../../assets/icons/ic_bookmark_stroke.svg';
import BookmarkFill from '../../../../assets/icons/ic_bookmark_fill.svg';

// ButtonIcon size="L" 과 동일한 히트영역/아이콘 크기
const BUTTON_SIZE = 40;
const ICON_SIZE = 20;

// 누르면 살짝 아래로(2px) 눌렸다가 스프링으로 올라오면서 색이 채워진다.
export default function BookmarkButton({
  isBookmarked = false,
  onPress,
  disabled = false,
}) {
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handlePress = () => {
    if (disabled) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // press → y축 2px 아래 → 스프링으로 원위치(올라오며)
    translateY.value = withSequence(
      withTiming(2, { duration: 90 }),
      withSpring(0, { damping: 20, stiffness: 220 }),
    );

    onPress?.();
  };

  const Icon = isBookmarked ? BookmarkFill : BookmarkStroke;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      hitSlop={8}
      style={styles.button}
    >
      <Animated.View style={animatedStyle}>
        <Icon
          width={ICON_SIZE}
          height={ICON_SIZE}
          color={isBookmarked ? colors.fgBrand : palette.gray[30]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: radius.XS,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
