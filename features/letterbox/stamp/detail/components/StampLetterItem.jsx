import { memo, useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useIsFocused } from '@react-navigation/native';
import Animated from 'react-native-reanimated';

import { resolveEnvelope } from '../../../../../shared/utils/envelopeUtils';

import Letter from '../../../components/Letter';
import useLetterFlip from '../../../hooks/useLetterFlip';

// Letter 원본 크기(320x232)의 폭. 목록 셀이 가운데 정렬이라 폭을 정해줘야 한다.
const LETTER_WIDTH = 320;

// 안읽음 편지 스택(UnreadLetterStack)과 같은 순서로 기울인다
const LETTER_ROTATIONS = [-4, 0, 4, 0];

/**
 * 우표 상세 편지 목록의 편지 한 장.
 * 뒷면으로 보이고, 누르면 앞면으로 뒤집힌 뒤 onPress 가 호출된다 (편지 상세로 이동).
 *
 * @param {object} letter useStampDetail 의 letters[] 항목
 * @param {number} index 목록 내 순서 (기울기 결정)
 * @param {import('react-native-reanimated').SharedValue<boolean>} isFlipping 목록 전체에서 한 번에 한 장만 뒤집히게 공유하는 값
 * @param {(letter: object) => void} [onPress] 앞면으로 다 뒤집힌 뒤 호출
 */
const StampLetterItem = ({ letter, index, isFlipping, onPress }) => {
  const isFocused = useIsFocused();
  const { face, flipStyle, flip, resetFace } = useLetterFlip({
    lock: isFlipping,
    onFlipEnd: () => onPress?.(letter),
  });

  const { FrontSvg, FlapSvg, StampSvg } = useMemo(
    () =>
      resolveEnvelope({
        patternId: letter.envelope?.pattern,
        colorId: letter.envelope?.color,
        stampId: letter.envelope?.stamp,
      }),
    [letter.envelope?.pattern, letter.envelope?.color, letter.envelope?.stamp],
  );

  const rotate = `${LETTER_ROTATIONS[index % LETTER_ROTATIONS.length]}deg`;

  // 상세에서 돌아오면 다시 뒷면으로 되돌린다
  useEffect(() => {
    if (isFocused) resetFace('back');
  }, [isFocused, resetFace]);

  return (
    <Pressable onPress={flip} style={[styles.item, { transform: [{ rotate }] }]}>
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
  item: {
    width: LETTER_WIDTH,
  },
});

export default memo(StampLetterItem);
