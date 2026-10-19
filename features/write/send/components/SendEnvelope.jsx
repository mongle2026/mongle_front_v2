import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

import {
  BODY_ASPECT_RATIO,
  FLAP_HEIGHT_RATIO,
  SEND_ENVELOPE_PATHS,
  SEND_ENVELOPE_VIEWBOX,
  findSendEnvelopeLayers,
} from '../data/sendEnvelopeData';

const { width: VB_W, bodyHeight: VB_BODY_H, flapHeight: VB_FLAP_H } =
  SEND_ENVELOPE_VIEWBOX;

// 기존 봉투 flap SVG(편지 미리보기용)는 그림자 여백이 있어 도형만 박스에 맞게 키워 그린다
const LEGACY_FLAP_BLEED = { x: 0.0262, y: 0.0492 };

// 반쯤 접힌 뒤 숨는 면은 scaleY 를 이 값으로 눌러 보이지 않게 한다.
// 0 이면 뷰가 사라졌다 다시 그려지며 깜빡일 수 있어 아주 얇게만 남긴다
const MIN_FLAP_SCALE = 0.001;

/*
 * 레이어마다 zIndex 를 고정하고 collapsable={false} 로 뷰 평탄화를 막는다.
 * 새 아키텍처(Fabric)는 렌더 중 뷰 평탄화 상태가 바뀌면 자식을 다시 붙이면서
 * 형제 순서가 잠깐 어긋날 수 있다. 그러면 내용물이 앞주머니 · 덮개 위로 튀어나와 보인다.
 */
const LAYER_Z = {
  flapBack: 0,
  back: 1,
  content: 2,
  front: 3,
  flap: 4,
};

/*
 * 레이어 순서 (아래 → 위)
 *   열린 덮개 → 뒷판 → [내용물 → 앞주머니] → 닫힌 덮개
 *   (앞주머니는 내용물을 자르는 영역 안에 내용물과 함께 둔다)
 *
 * 덮개는 봉투 윗변을 축으로 접힌다. flapProgress 0 = 열림, 1 = 닫힘.
 * 열린 덮개(안쪽 면)는 내용물 뒤에, 닫힌 덮개(무늬 면)는 맨 위에 그려야 해서
 * 두 면을 따로 두고 같은 축으로 함께 접는다. 반쯤 넘어간 순간 앞 면은 납작해져 사라지고
 * 다른 면이 펴지기 시작한다.
 *
 * 접힘은 rotateX 대신 축(박스 가운데)을 기준으로 한 scaleY(cos) 로 그린다.
 * 3D 회전을 쓰면 iOS 가 형제 뷰끼리 깊이로 정렬해, 접히는 덮개가 내용물 뒤로 파고들어
 * 사진이 덮개 앞으로 튀어나와 보인다. 2D 로 그리면 레이어 순서가 그대로 지켜진다.
 */
const SendEnvelope = ({
  width,
  colorId,
  color,
  FallbackFlapSvg,
  flapProgress,
  contentClipTop,
  children,
}) => {
  const height = width / BODY_ASPECT_RATIO;
  const flapHeight = width * FLAP_HEIGHT_RATIO;

  const layers = findSendEnvelopeLayers(colorId);

  // 덮개 축(봉투 윗변)이 가운데 오도록 위아래로 덮개 높이만큼 늘린 박스
  const hingeBox = {
    position: 'absolute',
    left: 0,
    top: -flapHeight,
    width,
    height: flapHeight * 2,
  };

  // 보이는 면은 opacity 를 바꾸지 않고 scaleY 만으로 숨긴다 (opacity 토글 시 깜빡임 방지)
  const flapBackStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: Math.max(Math.cos(Math.PI * flapProgress.value), MIN_FLAP_SCALE) },
    ],
  }));

  const flapStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: Math.max(-Math.cos(Math.PI * flapProgress.value), MIN_FLAP_SCALE) },
    ],
  }));

  return (
    <View style={{ width, height }}>
      <Animated.View
        style={[hingeBox, { zIndex: LAYER_Z.flapBack }, flapBackStyle]}
        pointerEvents="none"
        collapsable={false}
      >
        <View style={[styles.hingeTop, { height: flapHeight }]}>
          {layers ? (
            <layers.FlapBack width="100%" height="100%" preserveAspectRatio="none" />
          ) : (
            <ShapeSvg
              viewBoxHeight={VB_FLAP_H}
              path={SEND_ENVELOPE_PATHS.flapBack}
              color={color}
            />
          )}
        </View>
      </Animated.View>

      <View
        style={[StyleSheet.absoluteFill, { zIndex: LAYER_Z.back }]}
        pointerEvents="none"
        collapsable={false}
      >
        {layers ? (
          <layers.Back width="100%" height="100%" preserveAspectRatio="none" />
        ) : (
          <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_BODY_H}`}>
            <Rect width={VB_W} height={VB_BODY_H} fill={color} />
          </Svg>
        )}
      </View>

      {/* 내용물은 봉투 위쪽으로는 보이고, 봉투 아랫변 아래로는 잘린다 */}
      <View
        style={[styles.contentClip, { top: -contentClipTop, zIndex: LAYER_Z.content }]}
        pointerEvents="none"
        collapsable={false}
      >
        {children}

        {/* 앞주머니는 내용물과 같은 부모 안, 내용물보다 뒤에 그려 항상 내용물을 덮는다 */}
        <View
          style={[styles.front, { top: contentClipTop, width, height, zIndex: LAYER_Z.front }]}
          pointerEvents="none"
          collapsable={false}
        >
          {layers ? (
            <layers.Front width="100%" height="100%" preserveAspectRatio="none" />
          ) : (
            <ShapeSvg
              viewBoxHeight={VB_BODY_H}
              path={SEND_ENVELOPE_PATHS.front}
              color={color}
            />
          )}
        </View>
      </View>

      <Animated.View
        style={[hingeBox, { zIndex: LAYER_Z.flap }, flapStyle]}
        pointerEvents="none"
        collapsable={false}
      >
        <View
          style={[
            styles.hingeBottom,
            { top: flapHeight, height: flapHeight },
          ]}
        >
          {layers ? (
            <layers.Flap width="100%" height="100%" preserveAspectRatio="none" />
          ) : FallbackFlapSvg ? (
            <View style={bleedStyle(LEGACY_FLAP_BLEED)}>
              <FallbackFlapSvg width="100%" height="100%" preserveAspectRatio="none" />
            </View>
          ) : (
            <ShapeSvg
              viewBoxHeight={VB_FLAP_H}
              path={SEND_ENVELOPE_PATHS.flap}
              color={color}
            />
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const ShapeSvg = ({ viewBoxHeight, path, color }) => (
  <Svg
    width="100%"
    height="100%"
    viewBox={`0 0 ${VB_W} ${viewBoxHeight}`}
    preserveAspectRatio="none"
  >
    <Path d={path} fill={color} />
  </Svg>
);

function bleedStyle(pad) {
  return {
    position: 'absolute',
    left: `${-pad.x * 100}%`,
    top: `${-pad.y * 100}%`,
    width: `${(1 + 2 * pad.x) * 100}%`,
    height: `${(1 + 2 * pad.y) * 100}%`,
  };
}

const styles = StyleSheet.create({
  hingeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  hingeBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  front: {
    position: 'absolute',
    left: 0,
  },
  contentClip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
});

export default memo(SendEnvelope);
