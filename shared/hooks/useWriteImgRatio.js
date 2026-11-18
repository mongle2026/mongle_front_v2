import { getWriteImgRatio } from '../components/atomic/WriteImg';
import useImageSize from './useImageSize';

// 서버에서 받은 이미지의 실제 크기로 WriteImg 비율을 정한다.
// 크기를 읽기 전에는 기본 4:3
const useWriteImgRatio = imageSource => {
  const size = useImageSize(imageSource);

  return getWriteImgRatio(size ?? undefined);
};

export default useWriteImgRatio;
