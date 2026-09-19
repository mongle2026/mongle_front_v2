import {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import useLetterFlip from '../../../../shared/hooks/useLetterFlip';

/* 편지 봉투 미리보기의 앞/뒷면 전환 애니메이션을 관리한다.
 * 뒤집기는 공통 useLetterFlip 을 쓰고, 뒤집히는 동안 flap 을 잠깐 숨기는 것만 이 화면에서 더한다. */
export default function useEnvelopePreviewFlip() {
  const { face, flipStyle, flip } = useLetterFlip({ initialFace: 'back' });

  const flapOpacity = useSharedValue(1);
  const flapStyle = useAnimatedStyle(() => ({ opacity: flapOpacity.value }));

  const handleToggleFace = () => {
    if (!flip()) return;

    flapOpacity.value = withSequence(
      withDelay(120, withTiming(0, { duration: 60 })),
      withDelay(55, withTiming(1, { duration: 150 })),
    );
  };

  return {
    previewFace: face,
    flipStyle,
    flapStyle,
    handleToggleFace,
  };
}
