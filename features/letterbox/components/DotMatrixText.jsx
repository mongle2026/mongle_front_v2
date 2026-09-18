import { memo, useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { DOT_ROWS, buildDotColumns } from '../../../shared/utils/dotFontUtils';

// dot 하나를 원으로 그리는 path 조각
function circlePath(cx, cy, radius) {
  return (
    `M${cx - radius} ${cy}` +
    `a${radius} ${radius} 0 1 0 ${radius * 2} 0` +
    `a${radius} ${radius} 0 1 0 ${-radius * 2} 0Z`
  );
}

/**
 * 읽지 않은 편지의 제목/가수를 3줄 dot 격자로 보여준다.
 * 컨테이너 폭을 재서 왼쪽부터 dot을 채우고, 글자에 해당하는 dot만 강조색으로 칠한다.
 * dot이 한 블록에 150개가 넘어가서, View를 쌓지 않고 색상별 path 2개로 그린다.
 *
 * @param {string}  [text]      dot으로 그릴 문자열
 * @param {number}  dotSize     dot 지름
 * @param {number}  colGap      dot 사이 가로 간격
 * @param {number}  rowPitch    줄 간격 (dot 높이 + 줄 사이 여백)
 * @param {string}  baseColor   글자가 아닌 dot 색
 * @param {string}  fillColor   글자에 해당하는 dot 색
 */
function DotMatrixText({ text, dotSize, colGap, rowPitch, baseColor, fillColor }) {
  const [width, setWidth] = useState(0);

  const height = DOT_ROWS * rowPitch;
  const colPitch = dotSize + colGap;
  // 마지막 dot 뒤에는 간격이 없으므로 colGap 만큼 더해서 나눈다. 남는 폭은 오른쪽에 그대로 둔다.
  const columnCount =
    width > 0 ? Math.floor((width + colGap) / colPitch) : 0;

  const { basePath, fillPath } = useMemo(() => {
    const columns = buildDotColumns(text, columnCount);
    const radius = dotSize / 2;
    const base = [];
    const fill = [];

    for (let x = 0; x < columns.length; x += 1) {
      const cx = x * colPitch + radius;
      for (let y = 0; y < DOT_ROWS; y += 1) {
        const cy = y * rowPitch + rowPitch / 2;
        const isFilled = (columns[x] & (1 << y)) !== 0;
        (isFilled ? fill : base).push(circlePath(cx, cy, radius));
      }
    }

    return { basePath: base.join(''), fillPath: fill.join('') };
  }, [text, columnCount, colPitch, rowPitch, dotSize]);

  return (
    <View
      style={{ height, alignSelf: 'stretch' }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {columnCount > 0 ? (
        <Svg width={width} height={height}>
          <Path d={basePath} fill={baseColor} />
          {fillPath ? <Path d={fillPath} fill={fillColor} /> : null}
        </Svg>
      ) : null}
    </View>
  );
}

export default memo(DotMatrixText);
