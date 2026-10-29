import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../../styles/color';
import { gap, padding, radius } from '../../styles/token';
import { typo } from '../../styles/typo';

const TIP_WIDTH = 14;
const TIP_HEIGHT = 8;
// 경계가 소수점 픽셀에 걸리면 삼각형과 말풍선 사이에 틈이 보여서,
// 밑변을 이만큼 늘려 말풍선 안쪽으로 겹쳐 그린다 (같은 색이라 겹친 부분은 안 보인다)
const TIP_OVERLAP = 1;
const TIP_SVG_HEIGHT = TIP_HEIGHT + TIP_OVERLAP;

// 말풍선 위에 붙으면 위를, 아래에 붙으면 아래를 가리키는 삼각형
const TIP_PATHS = {
  top: `M${TIP_WIDTH / 2} 0L${TIP_WIDTH} ${TIP_HEIGHT}V${TIP_SVG_HEIGHT}H0V${TIP_HEIGHT}Z`,
  bottom: `M0 0H${TIP_WIDTH}V${TIP_OVERLAP}L${TIP_WIDTH / 2} ${TIP_SVG_HEIGHT}L0 ${TIP_OVERLAP}Z`,
};

const ARROW_JUSTIFY = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
};

/**
 * @param {'top' | 'bottom'} [arrowPosition] 화살표가 말풍선 위/아래 중 어디에 붙는지
 * @param {'start' | 'center' | 'end'} [arrowAlign] 화살표의 가로 정렬
 */
const Coachmark = ({
  title,
  body,
  arrowPosition = 'top',
  arrowAlign = 'start',
  style,
}) => {
  const arrow = (
    <View
      style={[
        styles.arrow,
        arrowPosition === 'top' ? styles.arrowTop : styles.arrowBottom,
        { justifyContent: ARROW_JUSTIFY[arrowAlign] },
      ]}
    >
      <Svg width={TIP_WIDTH} height={TIP_SVG_HEIGHT} viewBox={`0 0 ${TIP_WIDTH} ${TIP_SVG_HEIGHT}`}>
        <Path d={TIP_PATHS[arrowPosition]} fill={colors.bgNeutralInverted} />
      </Svg>
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {arrowPosition === 'top' && arrow}

      <View style={styles.bubble}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>

      {arrowPosition === 'bottom' && arrow}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  arrow: {
    flexDirection: 'row',
    paddingHorizontal: padding.XL,
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },
  arrowTop: {
    marginBottom: -TIP_OVERLAP,
  },
  arrowBottom: {
    marginTop: -TIP_OVERLAP,
  },
  bubble: {
    paddingVertical: padding.L,
    paddingHorizontal: padding.XL,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.XS,
    alignSelf: 'stretch',
    borderRadius: radius.S,
    backgroundColor: colors.bgNeutralInverted,
  },
  title: {
    ...typo.suitLabelLargeStrong,
    alignSelf: 'stretch',
    color: colors.fgNeutralInverted,
  },
  body: {
    ...typo.suitBodyMedium,
    alignSelf: 'stretch',
    color: colors.fgNeutralQuaternary,
  },
});

export default memo(Coachmark);
