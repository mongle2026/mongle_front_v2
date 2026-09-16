import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { resolveEnvelope } from '../../../../shared/utils/envelopeUtils';

import Letter from '../../../letter/components/Letter';

// Letter 원본 크기(320x232)의 폭. 목록 셀이 가운데 정렬이라 폭을 정해줘야 한다.
const LETTER_WIDTH = 320;

// 안읽음 편지 스택(UnreadLetterStack)과 같은 순서로 기울인다
const LETTER_ROTATIONS = [-4, 0, 4, 0];

/**
 * 우표 상세 편지 목록의 편지 한 장 (봉투 뒷면).
 *
 * @param {object} letter useStampDetail 의 letters[] 항목
 * @param {number} index 목록 내 순서 (기울기 결정)
 * @param {(letter: object) => void} [onPress]
 */
const StampLetterItem = ({ letter, index, onPress }) => {
  const { FrontSvg, StampSvg } = useMemo(
    () =>
      resolveEnvelope({
        patternId: letter.envelope?.pattern,
        colorId: letter.envelope?.color,
        stampId: letter.envelope?.stamp,
      }),
    [letter.envelope?.pattern, letter.envelope?.color, letter.envelope?.stamp],
  );

  const rotate = `${LETTER_ROTATIONS[index % LETTER_ROTATIONS.length]}deg`;

  return (
    <Pressable onPress={() => onPress?.(letter)} style={[styles.item, { transform: [{ rotate }] }]}>
      <Letter
        type="back"
        BackgroundSvg={FrontSvg}
        StampSvg={StampSvg}
        recipient={letter.recipientName}
        sender={letter.senderName}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  item: {
    width: LETTER_WIDTH,
  },
});

export default memo(StampLetterItem);
