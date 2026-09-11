import { useState } from 'react';

import { padding } from '../../../../shared/styles/token';

/*
 * 컨테이너 너비를 측정해 주어진 비율을 유지하는
 * 편지 미리보기 사이즈를 계산한다
 */
export default function useLetterPreviewSize(
  aspectRatio,
  verticalInset = padding.XXL * 2,
) {
  const [containerWidth, setContainerWidth] = useState(null);

  const onLayout = (e) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const previewSize = (() => {
    if (!containerWidth) return null;

    const naturalHeight = containerWidth / aspectRatio;
    const height = Math.max(naturalHeight - verticalInset, 0);
    const width = height * aspectRatio;

    return { width, height };
  })();

  return { previewSize, onLayout };
}
