import React, { memo, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Path } from '@shopify/react-native-skia';
import { colors } from '../../styles/color';

// ==============================
// Design values
// ==============================

const TEXTURE_SIZE = 58.4;
const RADIUS = 3.1;

const LINE_COLOR = colors.strokeBrandSolid;
const STROKE_WIDTH = 1;

// 화면에서 원하는 Divider 영역 높이.
// 너무 작게 설정해도 실제 선이 잘릴 정도라면
// 아래 MIN_CANVAS_HEIGHT가 자동으로 우선됩니다.
const DESIRED_HEIGHT = 6;

// 선과 Canvas 끝 사이에 남겨둘 여유 공간
const SAFETY_PADDING = 1;

// ==============================
// Wave strength
// ==============================

// 디자인 스펙인 RADIUS 3.1은 유지하고
// 실제 화면상의 굴곡 정도는 이 값들로 조절합니다.
const PRIMARY_WAVE_STRENGTH = 0.25;
const SECONDARY_WAVE_STRENGTH = 0.15;
const MICRO_WAVE_STRENGTH = 0.05;

// ==============================
// Safe height calculation
// ==============================

// 모든 wave가 같은 방향으로 최대치에 도달한다고 가정한
// 가장 보수적인 최대 굴곡 범위
const MAX_WAVE_OFFSET =
  RADIUS *
  (
    PRIMARY_WAVE_STRENGTH +
    SECONDARY_WAVE_STRENGTH +
    MICRO_WAVE_STRENGTH
  );

// stroke는 Path 중심을 기준으로 양쪽으로 퍼지기 때문에
// 절반만 추가하면 됩니다.
const HALF_STROKE = STROKE_WIDTH / 2;

// 중심선을 기준으로 필요한 한쪽 공간
const REQUIRED_HALF_HEIGHT =
  MAX_WAVE_OFFSET +
  HALF_STROKE +
  SAFETY_PADDING;

// 위 + 아래 전체 최소 높이
const MIN_CANVAS_HEIGHT = Math.ceil(
  REQUIRED_HALF_HEIGHT * 2,
);

// 사용자가 원하는 높이가 너무 작으면
// 안전하게 필요한 최소 높이를 자동으로 사용
const CANVAS_HEIGHT = Math.max(
  DESIRED_HEIGHT,
  MIN_CANVAS_HEIGHT,
);

const createDividerPath = width => {
  const centerY = CANVAS_HEIGHT / 2;

  // 값이 작을수록 점이 많아져 더 세밀한 선이 됩니다.
  const step = 3;

  let path = '';

  const getY = x => {
    const wave1 =
      Math.sin(
        (x / TEXTURE_SIZE) * Math.PI * 2,
      ) *
      RADIUS *
      PRIMARY_WAVE_STRENGTH;

    const wave2 =
      Math.sin(
        (x / (TEXTURE_SIZE * 1.73)) * Math.PI * 2 + 1.7,
      ) *
      RADIUS *
      SECONDARY_WAVE_STRENGTH;

    const wave3 =
      Math.sin(
        (x / (TEXTURE_SIZE * 0.47)) * Math.PI * 2 + 0.8,
      ) *
      RADIUS *
      MICRO_WAVE_STRENGTH;

    return centerY + wave1 + wave2 + wave3;
  };

  for (let x = 0; x <= width; x += step) {
    const y = getY(x);

    if (x === 0) {
      path = `M ${x} ${y}`;
    } else {
      path += ` L ${x} ${y}`;
    }
  }

  // width가 step으로 정확하게 나누어지지 않는 경우에도
  // 마지막 끝점까지 선이 연결되도록 처리
  if (width % step !== 0) {
    const x = width;
    const y = getY(x);

    path += ` L ${x} ${y}`;
  }

  return path;
};

export const DividerLine = memo(() => {
  const [width, setWidth] = useState(0);

  const handleLayout = useCallback(event => {
    const nextWidth = Math.round(
      event.nativeEvent.layout.width,
    );

    if (nextWidth <= 0) return;

    setWidth(currentWidth => {
      if (currentWidth === nextWidth) {
        return currentWidth;
      }

      return nextWidth;
    });
  }, []);

  const path = useMemo(() => {
    if (width <= 0) {
      return '';
    }

    return createDividerPath(width);
  }, [width]);

  return (
    <View
      accessible={false}
      pointerEvents="none"
      onLayout={handleLayout}
      style={styles.container}
    >
      {width > 0 && (
        <Canvas
          style={{
            width,
            height: CANVAS_HEIGHT,
          }}
        >
          <Path
            path={path}
            color={LINE_COLOR}
            style="stroke"
            strokeWidth={STROKE_WIDTH}
            strokeCap="round"
            strokeJoin="round"
            antiAlias
          />
        </Canvas>
      )}
    </View>
  );
});

DividerLine.displayName = 'DividerLine';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: CANVAS_HEIGHT,
  },
});