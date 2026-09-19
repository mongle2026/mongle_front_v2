import { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useIsFocused } from '@react-navigation/native';
import Animated from 'react-native-reanimated';

import Letter from './Letter';
import useLetterFlip from '../hooks/useLetterFlip';
import useResolvedEnvelope from '../hooks/useResolvedEnvelope';

// Letter 원본 크기(320x232)
export const LETTER_WIDTH = 320;
export const LETTER_HEIGHT = 232;

// 편지 기울기 (-4, 0, 4, 0 반복). 안 읽음 편지 더미와 우표 상세 목록이 같은 순서로 기울인다
const LETTER_ROTATIONS = [-4, 0, 4, 0];

export const getLetterRotation = index =>
  `${LETTER_ROTATIONS[index % LETTER_ROTATIONS.length]}deg`;

/**
 * 뒷면으로 보이고, 누르면 앞면으로 뒤집힌 뒤 onPress 가 호출되는 편지 한 장 (편지 상세로 이동).
 * 상세에서 돌아와 화면이 다시 포커스되면 뒷면으로 되돌린다.
 *
 * @param {object} letter envelope, recipientName, senderName 을 가진 편지
 * @param {import('react-native-reanimated').SharedValue<boolean>} isFlipping 목록 전체에서 한 번에 한 장만 뒤집히게 공유하는 값
 * @param {(letter: object) => void} [onPress] 앞면으로 다 뒤집힌 뒤 호출
 * @param {object} [style] 누르는 영역 스타일 (기울기 등)
 */
const FlippableLetter = ({ letter, isFlipping, onPress, style }) => {
  const isFocused = useIsFocused();
  const { face, flipStyle, flip, resetFace } = useLetterFlip({
    lock: isFlipping,
    onFlipEnd: () => onPress?.(letter),
  });

  const { FrontSvg, FlapSvg, StampSvg } = useResolvedEnvelope(letter.envelope);

  // 상세에서 돌아왔는데 아직 목록에 남아 있으면 다시 뒷면으로 되돌린다
  useEffect(() => {
    if (isFocused) resetFace('back');
  }, [isFocused, resetFace]);

  return (
    <Pressable onPress={flip} style={[styles.letter, style]}>
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
  );
};

const styles = StyleSheet.create({
  // 목록 셀이 가운데 정렬이라 폭을 정해줘야 한다
  letter: {
    width: LETTER_WIDTH,
  },
});

export default memo(FlippableLetter);
