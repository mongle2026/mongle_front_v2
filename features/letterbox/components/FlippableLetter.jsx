import { memo, useCallback, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useIsFocused } from '@react-navigation/native';
import Animated from 'react-native-reanimated';

import Letter, { LETTER_SIZE } from '../../../shared/components/content/Letter';
import useLetterFlip from '../../../shared/hooks/useLetterFlip';
import useResolvedEnvelope from '../hooks/useResolvedEnvelope';

// Letter 원본 크기
export const LETTER_WIDTH = LETTER_SIZE.width;
export const LETTER_HEIGHT = LETTER_SIZE.height;

// 편지 기울기 (-4, 0, 4, 0 반복). 안 읽음 편지 더미와 우표 상세 목록이 같은 순서로 기울인다
const LETTER_ROTATIONS = [-4, 0, 4, 0];

// 앞면으로 다 뒤집힌 뒤 편지 상세로 넘어가기까지 앞면을 보여주는 시간
const NAVIGATE_DELAY = 2000;

export const getLetterRotation = index =>
  `${LETTER_ROTATIONS[index % LETTER_ROTATIONS.length]}deg`;

/**
 * 뒷면으로 보이고, 누르면 앞면으로 뒤집힌 뒤 잠시 앞면을 보여주고 onPress 가 호출되는 편지 한 장 (편지 상세로 이동).
 * 기다리는 동안에는 이 편지도, 같은 목록의 다른 편지도 눌리지 않는다.
 * 상세에서 돌아와 화면이 다시 포커스되면 뒷면으로 되돌린다.
 *
 * @param {object} letter envelope, recipientName, senderName, isSenderWithdrawn 을 가진 편지
 * @param {import('react-native-reanimated').SharedValue<boolean>} isFlipping 목록 전체에서 한 번에 한 장만 뒤집히게 공유하는 값
 * @param {(letter: object) => void} [onPress] 앞면으로 다 뒤집히고 NAVIGATE_DELAY 뒤 호출
 * @param {object} [style] 누르는 영역 스타일 (기울기 등)
 */
const FlippableLetter = ({ letter, isFlipping, onPress, style }) => {
  const isFocused = useIsFocused();
  const navigateTimer = useRef(null);

  const releaseLock = useCallback(() => {
    if (isFlipping) isFlipping.value = false;
  }, [isFlipping]);

  const { face, flipStyle, flip, resetFace } = useLetterFlip({
    lock: isFlipping,
    onFlipEnd: () => {
      // 기다리는 동안 다른 편지가 뒤집히지 않도록 목록 잠금을 다시 건다
      if (isFlipping) isFlipping.value = true;
      navigateTimer.current = setTimeout(() => {
        navigateTimer.current = null;
        releaseLock();
        onPress?.(letter);
      }, NAVIGATE_DELAY);
    },
  });

  // 앞면을 보여주며 기다리는 중에는 다시 눌러도 뒤집지 않는다
  const handlePress = useCallback(() => {
    if (navigateTimer.current) return;
    flip();
  }, [flip]);

  // 기다리는 도중 사라지면 이동을 취소하고 목록 잠금을 푼다
  useEffect(() => () => {
    if (!navigateTimer.current) return;
    clearTimeout(navigateTimer.current);
    navigateTimer.current = null;
    releaseLock();
  }, [releaseLock]);

  const { color, FrontSvg, BackSvg, FlapSvg, StampSvg } = useResolvedEnvelope(letter.envelope);

  // 상세에서 돌아왔는데 아직 목록에 남아 있으면 다시 뒷면으로 되돌린다
  useEffect(() => {
    if (isFocused) resetFace('back');
  }, [isFocused, resetFace]);

  return (
    <Pressable onPress={handlePress} style={[styles.letter, style]}>
      <Animated.View style={flipStyle}>
        {face === 'back' ? (
          <Letter
            type="back"
            BackgroundSvg={BackSvg}
            StampSvg={StampSvg}
            recipient={letter.recipientName}
            sender={letter.senderName}
            isSenderWithdrawn={letter.isSenderWithdrawn}
            isDark={Boolean(color?.isDark)}
          />
        ) : (
          <Letter type="front" BackgroundSvg={FrontSvg} FlapSvg={FlapSvg} />
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  // 목록 셀이 가운데 정렬이라 폭을 정해줘야 한다
  letter: {
    width: LETTER_WIDTH,
  },
});

export default memo(FlippableLetter);
