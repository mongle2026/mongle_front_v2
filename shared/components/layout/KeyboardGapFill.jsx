import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../../styles/color';

/**
 * 키보드 위에 붙는 바(댓글 입력바 · 작성 BottomBar) 아래로 바 배경을 키보드 높이만큼 늘린다.
 *
 * iOS 키보드는 윗모서리가 둥글어서, 바를 키보드 바로 위에 붙여도
 * 양쪽 둥근 모서리 틈으로 뒤의 화면(스크롤 내용)이 비쳐 보인다.
 * 바 바로 아래(키보드 뒤)를 바 배경색으로 채워 그 틈을 가린다.
 * 키보드에 가려지는 영역이라 평소에는 보이지 않는다.
 *
 * 바 컨테이너(position: absolute) 안 마지막 자식으로 넣는다. 레이아웃 높이에는 영향을 주지 않는다.
 *
 * @param {number} height 키보드 높이 (키보드가 내려가 있으면 0 → 그리지 않음)
 * @param {string} [backgroundColor] 바 배경색
 */
const KeyboardGapFill = ({ height = 0, backgroundColor = colors.bgSurface }) => {
  if (height <= 0) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[styles.fill, { height, backgroundColor }]}
    />
  );
};

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
  },
});

export default memo(KeyboardGapFill);
