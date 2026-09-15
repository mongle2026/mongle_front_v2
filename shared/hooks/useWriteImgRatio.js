import { useEffect, useState } from 'react';
import { Image } from 'react-native';

import { getWriteImgRatio } from '../components/atomic/WriteImg';

// 서버에서 받은 이미지는 크기 정보가 없어서 실제 크기를 읽어 WriteImg 비율을 정한다.
// 크기를 읽기 전에는 기본 4:3
const useWriteImgRatio = imageSource => {
  const uri = typeof imageSource === 'string' ? imageSource : imageSource?.uri;

  const [size, setSize] = useState(null);

  useEffect(() => {
    if (!uri) return;

    let isActive = true;

    Image.getSize(
      uri,
      (width, height) => {
        if (isActive) setSize({ uri, width, height });
      },
      error => {
        console.warn('이미지 크기를 불러오지 못했습니다.', error);
      },
    );

    return () => {
      isActive = false;
    };
  }, [uri]);

  return getWriteImgRatio(size?.uri === uri ? size : undefined);
};

export default useWriteImgRatio;
