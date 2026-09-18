import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

// 뒤집기 반쪽(접기 / 펴기) 시간
export const LETTER_FLIP_HALF_DURATION = 250;

const FLIP_TIMING = { duration: LETTER_FLIP_HALF_DURATION };

const toggleFace = face => (face === 'back' ? 'front' : 'back');

/**
 * Letter 의 앞/뒷면 뒤집기 애니메이션.
 * Letter 자체에는 넣지 않고, 뒤집기가 필요한 화면에서만 이 훅을 써서 Letter 를 감싼다.
 *
 * 접었다가(scaleX 1 → 0) 면을 바꾸고, 바뀐 면이 실제로 그려진 뒤 다시 편다(0 → 1).
 *
 * @example
 * const { face, flipStyle, flip } = useLetterFlip({ onFlipEnd });
 * <Pressable onPress={flip}>
 *   <Animated.View style={flipStyle}>
 *     <Letter type={face} ... />
 *   </Animated.View>
 * </Pressable>
 *
 * @param {object} [options]
 * @param {'front' | 'back'} [options.initialFace='back']
 * @param {import('react-native-reanimated').SharedValue<boolean>} [options.lock]
 *   여러 장 중 한 번에 한 장만 뒤집히게 할 때 목록 전체에서 공유하는 값. 없으면 이 편지만 잠근다.
 * @param {(face: 'front' | 'back') => void} [options.onFlipEnd] 다 펴진 뒤 바뀐 면과 함께 호출
 * @returns {{
 *   face: 'front' | 'back',
 *   flipStyle: object,
 *   flip: () => boolean,
 *   resetFace: (face: 'front' | 'back') => void,
 * }}
 *   flip: 뒤집기 시작. 이미 뒤집히는 중이라 무시되면 false.
 *   resetFace: 뒤집히는 중이 아닐 때만 애니메이션 없이 면을 바꾼다.
 */
export default function useLetterFlip({ initialFace = 'back', lock, onFlipEnd } = {}) {
  const [face, setFace] = useState(initialFace);
  const flipScale = useSharedValue(1);
  const ownLock = useSharedValue(false);
  const isFlipping = lock ?? ownLock;
  const isFlippingSelf = useRef(false);

  const onFlipEndRef = useRef(onFlipEnd);
  useEffect(() => {
    onFlipEndRef.current = onFlipEnd;
  });

  const flipStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: flipScale.value }],
  }));

  const swapFace = useCallback(() => setFace(toggleFace), []);

  const flip = useCallback(() => {
    if (isFlipping.value) return false;
    isFlipping.value = true;
    isFlippingSelf.current = true;

    flipScale.value = withTiming(0, FLIP_TIMING, finished => {
      if (finished) scheduleOnRN(swapFace);
    });
    return true;
  }, [flipScale, isFlipping, swapFace]);

  // 바뀐 면이 실제로 그려진 뒤에 나머지 절반을 펴야 이전 면이 잠깐 보이지 않는다
  useEffect(() => {
    if (!isFlippingSelf.current) return;

    const finishFlip = () => {
      isFlippingSelf.current = false;
      isFlipping.value = false;
      onFlipEndRef.current?.(face);
    };

    flipScale.value = withTiming(1, FLIP_TIMING, finished => {
      if (finished) scheduleOnRN(finishFlip);
    });
  }, [face, flipScale, isFlipping]);

  const resetFace = useCallback(nextFace => {
    if (isFlippingSelf.current) return;
    setFace(nextFace);
  }, []);

  return { face, flipStyle, flip, resetFace };
}
