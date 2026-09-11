import { useRef, useState } from 'react';
import { Animated } from 'react-native';

/* 편지 봉투 미리보기의 앞/뒷면 전환 애니메이션을 관리한다 */
export default function useLetterFlip() {
  const [previewFace, setPreviewFace] = useState('back');
  const flipAnim = useRef(new Animated.Value(1)).current;
  const isFlippingRef = useRef(false);

  const flapOpacity = useRef(new Animated.Value(1)).current;

  const handleToggleFace = () => {
    if (isFlippingRef.current) return;
    isFlippingRef.current = true;

    Animated.timing(flipAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setPreviewFace((face) => (face === 'back' ? 'front' : 'back'));
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        isFlippingRef.current = false;
      });
    });

    Animated.timing(flapOpacity, {
      toValue: 0,
      duration: 60,
      delay: 120,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(flapOpacity, {
        toValue: 1,
        duration: 150,
        delay: 55,
        useNativeDriver: true,
      }).start();
    });
  };

  return {
    previewFace,
    flipAnim,
    flapOpacity,
    handleToggleFace,
  };
}
