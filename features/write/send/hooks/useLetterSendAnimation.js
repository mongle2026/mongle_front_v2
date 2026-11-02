import { useEffect, useMemo, useState } from 'react';
import {
  Easing,
  cancelAnimation,
  clamp,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';

/*
 * 편지 담기 타임라인 (ms). packT 하나를 0 → 끝까지 흘려보내고
 * 봉투 · 내용물 · 덮개가 각자 자기 구간만 읽어서 움직인다.
 *
 * 내용물(프로필 → 음악 커버 → 첨부 사진)은 세로 한 줄로 쌓여 내려오고,
 * 맨 아래 장부터 한 장씩 봉투 안 자기 자리에 멈춰 차곡차곡 포개진다.
 *   drop    : 줄이 위에서 내려와 첫 장(프로필)이 봉투에 담긴다
 *   step    : 줄이 한 칸씩 내려오며 다음 장이 앞 장 위에 포개진다
 *   sink    : 다 담긴 묶음이 봉투 안으로 가라앉는다
 *   flap    : 덮개가 닫힌다
 */
const ENTER_DURATION = 350;
const DROP_START = 300;
const DROP_DURATION = 700;
const STEP_HOLD = 180;
const STEP_DURATION = 480;
const SINK_HOLD = 350;
const SINK_DURATION = 450;
const FLAP_DURATION = 550;
// 덮개를 닫기 직전에 내용물을 숨긴다. 닫히는 동안에는 보일 필요가 없고,
// 남겨 두면 iOS 에서 레이어 순서가 어긋나 사진이 봉투 앞으로 비쳐 보일 수 있다
const CONTENT_HIDE_DURATION = 160;

export const createPackTimeline = itemCount => {
  const stepStart = DROP_START + DROP_DURATION + STEP_HOLD;
  const stepCount = Math.max(itemCount - 1, 0);
  const stepsEnd = stepStart + stepCount * (STEP_DURATION + STEP_HOLD) - STEP_HOLD;
  const sinkStart = Math.max(stepsEnd, DROP_START + DROP_DURATION) + SINK_HOLD;
  // 내용물이 봉투 윗변 아래로 다 내려간 뒤에 덮개를 닫는다
  const flapStart = sinkStart + SINK_DURATION + 80;

  return {
    enterDuration: ENTER_DURATION,
    dropStart: DROP_START,
    dropDuration: DROP_DURATION,
    stepStart,
    stepDuration: STEP_DURATION,
    stepHold: STEP_HOLD,
    sinkStart,
    sinkDuration: SINK_DURATION,
    flapStart,
    flapDuration: FLAP_DURATION,
    contentHideStart: flapStart - CONTENT_HIDE_DURATION,
    contentHideDuration: CONTENT_HIDE_DURATION,
    end: flapStart + FLAP_DURATION,
  };
};

/* t 가 [start, start + duration] 구간에서 얼마나 진행됐는지 (0 ~ 1) */
export const segment = (t, start, duration) => {
  'worklet';
  return clamp((t - start) / duration, 0, 1);
};

const easeOutCubic = Easing.out(Easing.cubic);
const easeInOutCubic = Easing.inOut(Easing.cubic);

const FLOAT_TILT_DEG = -6;
const BOB_AMPLITUDE = 8;
const BOB_DURATION = 1400;

// 이만큼 올리거나 이 속도보다 빠르게 튕기면 날아간다
const FLY_DISTANCE = 120;
const FLY_VELOCITY = 800;
const FLY_DURATION = 650;

// 끌어올리는 동안 안내 문구가 다 사라지는 거리
const HINT_FADE_DISTANCE = 60;

/**
 * 편지 전송 화면의 애니메이션.
 *
 * phase
 *   packing  : 봉투가 열린 채 등장 → 내용물이 떨어져 담김 → 덮개가 닫힘
 *   floating : 봉투가 기울어진 채 둥둥 떠 있고, 위로 끌어올려 날릴 수 있다
 *   done     : 날아간 뒤 완료 화면
 *
 * @param {number} itemCount 봉투에 담기는 내용물 개수
 * @param {number[]} columnStops 내용물 줄 아랫변의 위치 (봉투 윗변 기준, 아래가 +)
 *   [시작, 첫 장이 담길 때, 둘째 장이 담길 때, ...]
 * @param {number} sinkDistance 다 담긴 뒤 묶음이 더 가라앉는 거리
 * @param {boolean} canFly 전송 요청이 성공해 날릴 수 있는지
 * @param {number} liftDistance 담기 위치 → 떠 있는 위치까지 올라가는 거리
 * @param {number} flyDistance 날아가며 이동하는 거리 (화면 밖으로 나갈 만큼)
 */
export default function useLetterSendAnimation({
  itemCount,
  columnStops,
  sinkDistance,
  canFly,
  liftDistance,
  flyDistance,
}) {
  const [phase, setPhase] = useState('packing');
  const [isContentPacked, setIsContentPacked] = useState(false);

  const timeline = useMemo(() => createPackTimeline(itemCount), [itemCount]);

  const packT = useSharedValue(0);
  const liftP = useSharedValue(0);
  const bob = useSharedValue(0);
  const dragY = useSharedValue(0);
  const flyP = useSharedValue(0);
  const readyP = useSharedValue(0);
  const arrowBob = useSharedValue(0);

  useEffect(() => {
    packT.value = withTiming(
      timeline.end,
      { duration: timeline.end, easing: Easing.linear },
      finished => {
        if (finished) scheduleOnRN(setPhase, 'floating');
      },
    );

    return () => cancelAnimation(packT);
  }, [packT, timeline.end]);

  useEffect(() => {
    if (phase !== 'floating') return;

    liftP.value = withTiming(1, { duration: 700, easing: easeInOutCubic });
    bob.value = withRepeat(
      withTiming(1, { duration: BOB_DURATION, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [phase, liftP, bob]);

  const isFlyEnabled = phase === 'floating' && canFly;

  useEffect(() => {
    if (!isFlyEnabled) return;

    readyP.value = withTiming(1, { duration: 400 });
    arrowBob.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [isFlyEnabled, readyP, arrowBob]);

  const flapProgress = useDerivedValue(() =>
    easeInOutCubic(segment(packT.value, timeline.flapStart, timeline.flapDuration)),
  );

  const columnBottom = useDerivedValue(() => {
    const t = packT.value;
    const dropP = easeOutCubic(segment(t, timeline.dropStart, timeline.dropDuration));
    let value = columnStops[0] + (columnStops[1] - columnStops[0]) * dropP;

    for (let i = 2; i < columnStops.length; i += 1) {
      const start = timeline.stepStart + (i - 2) * (timeline.stepDuration + timeline.stepHold);
      const stepP = easeInOutCubic(segment(t, start, timeline.stepDuration));
      value += (columnStops[i] - columnStops[i - 1]) * stepP;
    }

    return value;
  });

  const contentOpacity = useDerivedValue(
    () =>
      1 - segment(packT.value, timeline.contentHideStart, timeline.contentHideDuration),
  );

  // 덮개가 닫히기 전에 내용물이 다 숨겨지면 내용물을 아예 그리지 않는다.
  // 레이어 순서나 애니메이션 값이 잠깐 어긋나도 닫힌 봉투 위로 사진이 비칠 수 없게 한다
  useAnimatedReaction(
    () => contentOpacity.value <= 0,
    (hidden, wasHidden) => {
      if (hidden && !wasHidden) scheduleOnRN(setIsContentPacked, true);
    },
  );

  const sinkOffset = useDerivedValue(
    () =>
      sinkDistance *
      easeInOutCubic(segment(packT.value, timeline.sinkStart, timeline.sinkDuration)),
  );

  const envelopeStyle = useAnimatedStyle(() => {
    const enterP = easeOutCubic(segment(packT.value, 0, timeline.enterDuration));
    const bobOffset = (bob.value - 0.5) * 2 * BOB_AMPLITUDE * liftP.value;

    return {
      opacity: enterP,
      transform: [
        {
          translateY:
            (1 - enterP) * 24 -
            liftP.value * liftDistance +
            bobOffset +
            dragY.value -
            flyP.value * flyDistance,
        },
        {
          rotate: `${
            liftP.value * FLOAT_TILT_DEG +
            (bob.value - 0.5) * 2 * liftP.value -
            flyP.value * 8
          }deg`,
        },
        { scale: 1 - flyP.value * 0.25 },
      ],
    };
  });

  // 봉투가 올라갈수록(끌어올리거나 둥둥 뜰 때) 그림자는 작고 옅어진다
  const shadowStyle = useAnimatedStyle(() => {
    const dragFactor = clamp(-dragY.value / 200, 0, 1);

    return {
      opacity:
        liftP.value * (1 - bob.value * 0.3) * (1 - dragFactor) * (1 - flyP.value),
      transform: [
        { scaleX: 1 - bob.value * 0.12 - dragFactor * 0.3 },
        { scaleY: 1 - bob.value * 0.12 - dragFactor * 0.3 },
      ],
    };
  });

  // 끌어올리기 시작하면 안내가 위로 흐려지며 사라진다
  const hintStyle = useAnimatedStyle(() => {
    const dragFade = interpolate(-dragY.value, [0, HINT_FADE_DISTANCE], [1, 0], 'clamp');

    return {
      opacity: readyP.value * dragFade * (1 - flyP.value),
      transform: [{ translateY: (1 - readyP.value) * 8 - (1 - dragFade) * 12 }],
    };
  });

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -arrowBob.value * 6 }],
  }));

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(isFlyEnabled)
        .activeOffsetY([-8, 8])
        .onUpdate(event => {
          // 아래로는 살짝만 따라온다
          dragY.value =
            event.translationY < 0 ? event.translationY : event.translationY * 0.2;
        })
        .onEnd(event => {
          const shouldFly =
            event.translationY < -FLY_DISTANCE || event.velocityY < -FLY_VELOCITY;

          if (!shouldFly) {
            dragY.value = withSpring(0, { damping: 14, stiffness: 160 });
            return;
          }

          flyP.value = withTiming(
            1,
            { duration: FLY_DURATION, easing: Easing.in(Easing.cubic) },
            finished => {
              if (finished) scheduleOnRN(setPhase, 'done');
            },
          );
        }),
    [isFlyEnabled, dragY, flyP],
  );

  return {
    phase,
    columnBottom,
    sinkOffset,
    contentOpacity,
    isContentPacked,
    flapProgress,
    envelopeStyle,
    shadowStyle,
    hintStyle,
    arrowStyle,
    gesture,
  };
}
