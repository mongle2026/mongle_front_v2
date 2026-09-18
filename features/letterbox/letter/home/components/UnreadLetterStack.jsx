import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useIsFocused } from '@react-navigation/native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { gap, padding } from '../../../../../shared/styles/token';
import { resolveEnvelope } from '../../../../../shared/utils/envelopeUtils';

import Letter from '../../../components/Letter';
import useUnreadLetterStack, { EXPAND_SCROLL_DISTANCE } from '../hooks/useUnreadLetterStack';

// Letter 원본 크기(320x232)
const LETTER_WIDTH = 320;
const LETTER_HEIGHT = 232;

// 모아진 상태의 영역 (375x461, 가운데 정렬)
const STAGE_HEIGHT = 461;
const COLLAPSED_TOP = (STAGE_HEIGHT - LETTER_HEIGHT) / 2;

// 펼쳐진 상태: 기울어진 편지 모서리가 잘리지 않도록 위아래 여백을 둔다
const EXPANDED_PADDING_VERTICAL = padding.XL;
const EXPANDED_GAP = gap.M;

// 모아진 상태에서 보이는 최대 편지 수. 나머지는 펼쳐지기 시작할 때 나타난다
const COLLAPSED_VISIBLE_COUNT = 3;
const HIDDEN_LETTER_REVEAL_PROGRESS = 0.05;

// 편지 기울기 (-4, 0, 4, 0 반복)
const LETTER_ROTATIONS = [-4, 0, 4, 0];

// 뒷면 → 앞면 뒤집기 반쪽 시간 (편지 작성 화면 useLetterFlip 과 동일)
const FLIP_TIMING = { duration: 250 };

const getExpandedTop = index => EXPANDED_PADDING_VERTICAL + index * (LETTER_HEIGHT + EXPANDED_GAP);

const getReceivedTime = letter => new Date(letter.receivedAt ?? 0).getTime() || 0;

const UnreadLetterItem = memo(({ letter, index, progress, isFlipping, onFlipEnd }) => {
  const isFocused = useIsFocused();
  const [face, setFace] = useState('back');
  const flipScale = useSharedValue(1);
  const isFlippingSelf = useRef(false);

  const { FrontSvg, FlapSvg, StampSvg } = useMemo(
    () =>
      resolveEnvelope({
        patternId: letter.envelope?.pattern,
        colorId: letter.envelope?.color,
        stampId: letter.envelope?.stamp,
      }),
    [letter.envelope?.pattern, letter.envelope?.color, letter.envelope?.stamp]
  );

  const expandedTop = getExpandedTop(index);
  const rotate = `${LETTER_ROTATIONS[index % LETTER_ROTATIONS.length]}deg`;
  const isHiddenWhenCollapsed = index >= COLLAPSED_VISIBLE_COUNT;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: isHiddenWhenCollapsed
      ? interpolate(progress.value, [0, HIDDEN_LETTER_REVEAL_PROGRESS], [0, 1], Extrapolation.CLAMP)
      : 1,
    transform: [
      // 최상단 편지를 기준으로 아래로 펼쳐진다
      { translateY: interpolate(progress.value, [0, 1], [COLLAPSED_TOP, expandedTop]) },
      { rotate },
    ],
  }));

  const flipStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: flipScale.value }],
  }));

  const finishFlip = useCallback(() => {
    isFlippingSelf.current = false;
    isFlipping.value = false;
    onFlipEnd(letter);
  }, [isFlipping, letter, onFlipEnd]);

  // 누르면 뒷면을 접었다가(scaleX 1 → 0) 앞면으로 바꿔 편다. 다 펴지면 상세로 이동한다
  const handlePress = useCallback(() => {
    if (isFlipping.value) return;
    isFlipping.value = true;
    isFlippingSelf.current = true;

    flipScale.value = withTiming(0, FLIP_TIMING, finished => {
      if (finished) scheduleOnRN(setFace, 'front');
    });
  }, [flipScale, isFlipping]);

  // 앞면이 실제로 그려진 뒤에 나머지 절반을 펴야 뒷면이 잠깐 보이지 않는다
  useEffect(() => {
    if (face !== 'front' || !isFlippingSelf.current) return;

    flipScale.value = withTiming(1, FLIP_TIMING, finished => {
      if (finished) scheduleOnRN(finishFlip);
    });
  }, [face, finishFlip, flipScale]);

  // 상세에서 돌아왔는데 아직 목록에 남아 있으면 다시 뒷면으로 되돌린다
  useEffect(() => {
    if (!isFocused || isFlippingSelf.current) return;
    setFace('back');
  }, [isFocused]);

  return (
    <Animated.View style={[styles.item, animatedStyle]}>
      <Pressable onPress={handlePress} style={styles.letter}>
        <Animated.View style={flipStyle}>
          {face === 'back' ? (
            <Letter
              type="back"
              BackgroundSvg={FrontSvg}
              StampSvg={StampSvg}
              recipient={letter.recipientName}
              sender={letter.senderName}
            />
          ) : (
            <Letter type="front" BackgroundSvg={FrontSvg} FlapSvg={FlapSvg} />
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

/**
 * 안 읽음 탭의 편지 더미.
 * 처음엔 최대 3장이 모아져 있고, 화면을 내리는 만큼 모든 편지가 아래로 펼쳐진다.
 * 편지는 뒷면으로 보이고, 누르면 앞면으로 뒤집힌 뒤 상세로 이동한다.
 *
 * 펼침 상태는 스크롤 위치라 이 컴포넌트가 마운트되어 있는 동안 유지된다.
 * - 편지함 필터 탭 / 우표 탭으로 전환: 언마운트되어 다시 모아진다
 * - 피드·프로필 탭 이동, 상세·기록 작성 후 복귀: 화면이 마운트된 채 남아 있어 그대로 유지된다
 *
 * @param {object[]} letters useLetterBox 의 letters
 * @param {number} [topInset] 목록 상단 여백 (Tabs 하단 그라데이션 밑으로 들어온 만큼)
 * @param {number} [bottomInset] 펼쳐진 목록 하단이 FAB에 가려지지 않도록 확보할 여백
 * @param {(letter: object) => void} [onPressLetter] 편지를 눌러 앞면으로 뒤집힌 뒤 호출
 * @param {(event: object) => void} [onScroll]
 */
const UnreadLetterStack = ({ letters, topInset = 0, bottomInset = 0, onPressLetter, onScroll }) => {
  const { progress, stickyOffset, scrollHandler } = useUnreadLetterStack({ onScroll });
  const [viewportHeight, setViewportHeight] = useState(0);

  // 한 번에 한 장만 뒤집힌다
  const isFlipping = useSharedValue(false);

  // 가장 최근에 발송된 편지가 최상단
  const sortedLetters = useMemo(
    () => [...letters].sort((a, b) => getReceivedTime(b) - getReceivedTime(a)),
    [letters]
  );

  // 최상단 편지가 맨 위에 겹쳐 보이도록 오래된 편지부터 그린다
  const letterEntries = useMemo(
    () => sortedLetters.map((letter, index) => ({ letter, index })).reverse(),
    [sortedLetters]
  );

  const expandedHeight = Math.max(
    STAGE_HEIGHT,
    getExpandedTop(sortedLetters.length) - EXPANDED_GAP + EXPANDED_PADDING_VERTICAL + bottomInset
  );

  // 펼치는 스크롤 거리 + 펼쳐진 목록. 편지가 적어도 끝까지 펼칠 수 있게 화면 높이만큼은 확보한다
  const contentHeight = EXPAND_SCROLL_DISTANCE + Math.max(expandedHeight, viewportHeight);

  const stickyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: stickyOffset.value }],
  }));

  const handleLayout = useCallback(event => {
    setViewportHeight(event.nativeEvent.layout.height);
  }, []);

  const handleFlipEnd = useCallback(letter => onPressLetter?.(letter), [onPressLetter]);

  return (
    <Animated.ScrollView
      onLayout={handleLayout}
      contentContainerStyle={{ paddingTop: topInset }}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.stage, { height: contentHeight }]}>
        <Animated.View style={[styles.sticky, stickyStyle]}>
          {letterEntries.map(({ letter, index }) => (
            <UnreadLetterItem
              key={letter.letterId}
              letter={letter}
              index={index}
              progress={progress}
              isFlipping={isFlipping}
              onFlipEnd={handleFlipEnd}
            />
          ))}
        </Animated.View>
      </Animated.View>
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  stage: {
    width: '100%',
  },
  sticky: {
    ...StyleSheet.absoluteFillObject,
  },
  item: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  letter: {
    width: LETTER_WIDTH,
  },
});

export default memo(UnreadLetterStack);
