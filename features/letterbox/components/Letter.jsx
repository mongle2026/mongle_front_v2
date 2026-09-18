import { useState } from 'react';
import { Animated, StyleSheet, View, Text, Image } from 'react-native';

import LetterBackground from '../../../assets/envelope/patterns/letter_cover_default.png';
import LetterFlap from '../../../assets/envelope/patterns/letter_flap_default.png';
import FlapShadow from '../../../assets/envelope/patterns/flap_shadow.png';
import LetterShadow from '../../../assets/envelope/patterns/letter_shadow.png';
import { colors } from '../../../shared/styles/color';
import { typo } from '../../../shared/styles/typo';
import { padding } from '../../../shared/styles/token';

const CARD_ASPECT_RATIO = 320 / 232;
const FLAP_ASPECT_RATIO = 318 / 164;

const FLAP_INSET_RATIO = (320 - 318) / 320 / 2;

// 배경이 살짝 기울어 보여 flap 오른쪽이 튀어나와 보이는 것을 보정하기 위해
// flap 전체를 왼쪽으로 살짝 이동시킨다 (wrapper 너비 기준 비율).
const FLAP_SHIFT_RATIO = 0.0023;
const FLAP_LEFT_INSET_RATIO = FLAP_INSET_RATIO - FLAP_SHIFT_RATIO;
const FLAP_RIGHT_INSET_RATIO = FLAP_INSET_RATIO + FLAP_SHIFT_RATIO;

// flap 각도 미세 조정용. 필요하면 이 값만 바꿔서 테스트한다 (기본 0 = 회전 없음).
const FLAP_ROTATE_DEG = -0.33;
const FLAP_ROTATE_TRANSFORM = [{ rotate: `${FLAP_ROTATE_DEG}deg` }];

const FRONT_BLEED = { x: 0.0508, y: 0.0617 }; // front: 여백 4.61%/5.49%, 도형 90.78%/89.01%
const FLAP_BLEED = { x: 0.0262, y: 0.0492 }; // flap : 여백 2.49%/4.48%, 도형 95.02%/91.04%

// 우표 원본 비율(59 : 88) — 너비만 72px 로 고정하고 높이는 비율로
const STAMP_ASPECT_RATIO = 59 / 88;

const FLAP_SHADOW_PAD = { left: 0.15, right: 0.15, top: 0.22, bottom: 0.28 };
const LETTER_SHADOW_PAD = { left: 0.12, right: 0.12, top: 0.12, bottom: 0.16 };

function Letter({
  type = 'front',
  BackgroundSvg,
  FlapSvg,
  StampSvg,
  recipient = '',
  sender = '',
  stampSource,
  style,
  flapOpacity = 1,
}) {
  const isBack = type === 'back';

  const [wrapperSize, setWrapperSize] = useState(null);
  const [flapSize, setFlapSize] = useState(null);

  return (
    <View
      style={[styles.wrapper, style]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setWrapperSize({ width, height });
      }}
    >
      {wrapperSize ? (
        <Image
          source={LetterShadow}
          style={paddedBoxStyle(wrapperSize, LETTER_SHADOW_PAD)}
          resizeMode="stretch"
          pointerEvents="none"
        />
      ) : null}

      {/* 배경: 넘겨받은 SVG 우선, 없으면 기본 PNG. wrapper 전체(컴포넌트 전체)를 채운다. */}
      <View
        style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
        pointerEvents="none"
      >
        {BackgroundSvg ? (
          <View style={bleedStyle(FRONT_BLEED)}>
            <BackgroundSvg width="100%" height="100%" preserveAspectRatio="none" />
          </View>
        ) : (
          <Image
            source={LetterBackground}
            style={StyleSheet.absoluteFill}
            resizeMode="stretch"
          />
        )}
      </View>

      {isBack ? (
        <View style={styles.card}>
          <View style={styles.section}>
            <View style={styles.container}>
              <Text style={styles.name} numberOfLines={1}>
                {recipient ? `${recipient}에게` : ''}
              </Text>
              <Text style={styles.name} numberOfLines={1}>
                {sender ? `${sender}이가` : ''}
              </Text>
            </View>

            {StampSvg ? (
              <View style={styles.stamp} pointerEvents="none">
                <StampSvg
                  width="100%"
                  height="100%"
                  preserveAspectRatio="xMidYMid slice"
                />
              </View>
            ) : stampSource ? (
              <Image source={stampSource} style={styles.stamp} resizeMode="cover" />
            ) : (
              <View style={styles.stamp} />
            )}
          </View>
        </View>
      ) : null}

      {/* flap은 card(paddingHorizontal 있음)가 아닌 wrapper 바로 아래 배치해
          배경과 동일한 기준 너비(320px 대비 318px)를 갖도록 한다. */}
      {!isBack ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: flapOpacity }]}
          pointerEvents="none"
        >
          {flapSize && wrapperSize ? (
            <Image
              source={FlapShadow}
              style={[
                paddedBoxStyle(
                  flapSize,
                  FLAP_SHADOW_PAD,
                  -FLAP_SHIFT_RATIO * wrapperSize.width,
                ),
                { transform: FLAP_ROTATE_TRANSFORM },
              ]}
              resizeMode="stretch"
              pointerEvents="none"
            />
          ) : null}

          <View
            style={styles.flapBox}
            pointerEvents="none"
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              setFlapSize({ width, height });
            }}
          >
            {FlapSvg ? (
              <View style={bleedStyle(FLAP_BLEED)}>
                <FlapSvg width="100%" height="100%" preserveAspectRatio="none" />
              </View>
            ) : (
              <Image source={LetterFlap} style={StyleSheet.absoluteFill} resizeMode="stretch" />
            )}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

/* 부모 박스보다 좌우/상하로 pad(x, y) 비율만큼 더 크게 그리는 절대 위치 스타일.
 * BackgroundSvg / FlapSvg 의 여백만큼 SVG를 오버사이즈로 그린 뒤, 부모의
 * overflow:hidden 이 넘치는 여백을 잘라내 실제 도형만 박스에 꽉 차게 한다. */
function bleedStyle(pad) {
  return {
    position: 'absolute',
    left: `${-pad.x * 100}%`,
    top: `${-pad.y * 100}%`,
    width: `${(1 + 2 * pad.x) * 100}%`,
    height: `${(1 + 2 * pad.y) * 100}%`,
  };
}

/* box(실측 width/height) 기준으로 pad 비율만큼 바깥으로 번진 절대 위치 스타일을 만든다.
 * left/right/top/bottom 을 퍼센트 문자열이 아닌 계산된 숫자(px)로 넘겨,
 * transform: scale 없이도 좌우/상하 대칭을 보장한다. */
function paddedBoxStyle(box, pad, shiftX = 0) {
  return {
    position: 'absolute',
    left: -pad.left * box.width + shiftX,
    top: -pad.top * box.height,
    width: box.width * (1 + pad.left + pad.right),
    height: box.height * (1 + pad.top + pad.bottom),
  };
}

const styles = StyleSheet.create({
  // width: 320px / height: 232px 대신 비율(40:29)로. 부모가 width 를 정한다.
  wrapper: {
    width: '100%',
    aspectRatio: CARD_ASPECT_RATIO,
  },
  card: {
    flex: 1,
    alignSelf: 'stretch',
    paddingVertical: padding.XL,
    paddingHorizontal: padding.XXL,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  // type="front" : 봉투 덮개, wrapper(배경) 상단에 원본 비율로 고정.
  // 배경 320px 기준 flap 318px 이므로 좌우 각각 FLAP_INSET_RATIO 만큼 인셋.
  flapBox: {
    position: 'absolute',
    top: 0,
    left: `${FLAP_LEFT_INSET_RATIO * 100}%`,
    right: `${FLAP_RIGHT_INSET_RATIO * 100}%`,
    aspectRatio: FLAP_ASPECT_RATIO,
    overflow: 'hidden',
    transform: FLAP_ROTATE_TRANSFORM,
  },

  // type="back" : section 안에 container + stamp 를 나란히
  section: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    flex: 1,
    alignSelf: 'stretch',
  },
  container: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
  },
  // recipient / sender 동일 스타일 (Kyobo2025/title/titleSmall)
  name: {
    alignSelf: 'stretch',
    color: colors.fgNeutralSolid,
    ...typo.kyoboTitleSmall,
  },
  // width 72px 고정, 높이는 원본 비율. lightgray 는 이미지 로딩 전 플레이스홀더.
  stamp: {
    width: 72,
    aspectRatio: STAMP_ASPECT_RATIO,
    backgroundColor: colors.bgDisabled,
  },
});

export default Letter;
