import { memo, useMemo } from 'react';

import FlippableLetter, { getLetterRotation } from '../../../components/FlippableLetter';

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
  const rotateStyle = useMemo(
    () => ({ transform: [{ rotate: getLetterRotation(index) }] }),
    [index],
  );

  return (
    <FlippableLetter
      letter={letter}
      isFlipping={isFlipping}
      onPress={onPress}
      style={rotateStyle}
    />
  );
};

export default memo(StampLetterItem);
