// 편지 전송 애니메이션에서 쓰는 봉투 레이어 (뒷판 / 앞주머니 / 닫힌 덮개 / 열린 덮개)

/* 레이어 SVG 원본 크기 (모든 레이어가 같은 폭을 쓴다) */
export const SEND_ENVELOPE_VIEWBOX = {
  width: 308.99,
  bodyHeight: 224.02,
  flapHeight: 157.68,
};

export const BODY_ASPECT_RATIO =
  SEND_ENVELOPE_VIEWBOX.width / SEND_ENVELOPE_VIEWBOX.bodyHeight;

export const FLAP_HEIGHT_RATIO =
  SEND_ENVELOPE_VIEWBOX.flapHeight / SEND_ENVELOPE_VIEWBOX.width;

/* 레이어 원본 도형 — 전용 에셋이 없는 색상은 이 도형을 봉투 색으로 채워 그린다 */
export const SEND_ENVELOPE_PATHS = {
  front:
    'M147.53,106.86L.14,0v224.02h308.99V0l-147.4,106.86c-4.23,3.07-9.96,3.07-14.19,0Z',
  flap:
    'M5.45,17.35L0,0h308.99l-2.59,10.4c-2.86,11.49-9.11,21.85-17.93,29.74l-130.35,116.52c-1.5,1.34-3.76,1.36-5.29.04L23.09,44.24c-8.26-7.16-14.36-16.46-17.64-26.89Z',
  flapBack:
    'M303.54,140.33l5.45,17.35H0l2.59-10.4c2.86-11.49,9.11-21.85,17.93-29.74L150.87,1.02c1.5-1.34,3.76-1.36,5.29-.04l129.74,112.46c8.26,7.16,14.36,16.46,17.64,26.89Z',
};

/*
 * 색상 id → 전용 레이어. 패턴 · 색상마다 4장(back / front / flap / flap_back)이 있고
 * 파일 이름이 envelopeData 의 색상 id 와 같다 (assets/envelope/send/<id>_<layer>.svg).
 * 색상이 추가되면 같은 이름 규칙으로 파일을 넣고 여기에 한 항목을 추가한다.
 */
const SEND_ENVELOPE_LAYER_SOURCES = {
  p1_c1: {
    Back: require('../../../../assets/envelope/send/p1_c1_back.svg'),
    Front: require('../../../../assets/envelope/send/p1_c1_front.svg'),
    Flap: require('../../../../assets/envelope/send/p1_c1_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p1_c1_flap_back.svg'),
  },
  p1_c2: {
    Back: require('../../../../assets/envelope/send/p1_c2_back.svg'),
    Front: require('../../../../assets/envelope/send/p1_c2_front.svg'),
    Flap: require('../../../../assets/envelope/send/p1_c2_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p1_c2_flap_back.svg'),
  },
  p1_c3: {
    Back: require('../../../../assets/envelope/send/p1_c3_back.svg'),
    Front: require('../../../../assets/envelope/send/p1_c3_front.svg'),
    Flap: require('../../../../assets/envelope/send/p1_c3_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p1_c3_flap_back.svg'),
  },
  p1_c4: {
    Back: require('../../../../assets/envelope/send/p1_c4_back.svg'),
    Front: require('../../../../assets/envelope/send/p1_c4_front.svg'),
    Flap: require('../../../../assets/envelope/send/p1_c4_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p1_c4_flap_back.svg'),
  },
  p1_c5: {
    Back: require('../../../../assets/envelope/send/p1_c5_back.svg'),
    Front: require('../../../../assets/envelope/send/p1_c5_front.svg'),
    Flap: require('../../../../assets/envelope/send/p1_c5_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p1_c5_flap_back.svg'),
  },
  p1_c6: {
    Back: require('../../../../assets/envelope/send/p1_c6_back.svg'),
    Front: require('../../../../assets/envelope/send/p1_c6_front.svg'),
    Flap: require('../../../../assets/envelope/send/p1_c6_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p1_c6_flap_back.svg'),
  },
  p2_c1: {
    Back: require('../../../../assets/envelope/send/p2_c1_back.svg'),
    Front: require('../../../../assets/envelope/send/p2_c1_front.svg'),
    Flap: require('../../../../assets/envelope/send/p2_c1_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p2_c1_flap_back.svg'),
  },
  p2_c2: {
    Back: require('../../../../assets/envelope/send/p2_c2_back.svg'),
    Front: require('../../../../assets/envelope/send/p2_c2_front.svg'),
    Flap: require('../../../../assets/envelope/send/p2_c2_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p2_c2_flap_back.svg'),
  },
  p2_c3: {
    Back: require('../../../../assets/envelope/send/p2_c3_back.svg'),
    Front: require('../../../../assets/envelope/send/p2_c3_front.svg'),
    Flap: require('../../../../assets/envelope/send/p2_c3_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p2_c3_flap_back.svg'),
  },
  p2_c4: {
    Back: require('../../../../assets/envelope/send/p2_c4_back.svg'),
    Front: require('../../../../assets/envelope/send/p2_c4_front.svg'),
    Flap: require('../../../../assets/envelope/send/p2_c4_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p2_c4_flap_back.svg'),
  },
  p2_c5: {
    Back: require('../../../../assets/envelope/send/p2_c5_back.svg'),
    Front: require('../../../../assets/envelope/send/p2_c5_front.svg'),
    Flap: require('../../../../assets/envelope/send/p2_c5_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p2_c5_flap_back.svg'),
  },
  p2_c6: {
    Back: require('../../../../assets/envelope/send/p2_c6_back.svg'),
    Front: require('../../../../assets/envelope/send/p2_c6_front.svg'),
    Flap: require('../../../../assets/envelope/send/p2_c6_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p2_c6_flap_back.svg'),
  },
  p3_c1: {
    Back: require('../../../../assets/envelope/send/p3_c1_back.svg'),
    Front: require('../../../../assets/envelope/send/p3_c1_front.svg'),
    Flap: require('../../../../assets/envelope/send/p3_c1_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p3_c1_flap_back.svg'),
  },
  p3_c2: {
    Back: require('../../../../assets/envelope/send/p3_c2_back.svg'),
    Front: require('../../../../assets/envelope/send/p3_c2_front.svg'),
    Flap: require('../../../../assets/envelope/send/p3_c2_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p3_c2_flap_back.svg'),
  },
  p3_c3: {
    Back: require('../../../../assets/envelope/send/p3_c3_back.svg'),
    Front: require('../../../../assets/envelope/send/p3_c3_front.svg'),
    Flap: require('../../../../assets/envelope/send/p3_c3_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p3_c3_flap_back.svg'),
  },
  p3_c4: {
    Back: require('../../../../assets/envelope/send/p3_c4_back.svg'),
    Front: require('../../../../assets/envelope/send/p3_c4_front.svg'),
    Flap: require('../../../../assets/envelope/send/p3_c4_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p3_c4_flap_back.svg'),
  },
  p4_c1: {
    Back: require('../../../../assets/envelope/send/p4_c1_back.svg'),
    Front: require('../../../../assets/envelope/send/p4_c1_front.svg'),
    Flap: require('../../../../assets/envelope/send/p4_c1_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p4_c1_flap_back.svg'),
  },
  p4_c2: {
    Back: require('../../../../assets/envelope/send/p4_c2_back.svg'),
    Front: require('../../../../assets/envelope/send/p4_c2_front.svg'),
    Flap: require('../../../../assets/envelope/send/p4_c2_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p4_c2_flap_back.svg'),
  },
  p4_c3: {
    Back: require('../../../../assets/envelope/send/p4_c3_back.svg'),
    Front: require('../../../../assets/envelope/send/p4_c3_front.svg'),
    Flap: require('../../../../assets/envelope/send/p4_c3_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p4_c3_flap_back.svg'),
  },
  p4_c4: {
    Back: require('../../../../assets/envelope/send/p4_c4_back.svg'),
    Front: require('../../../../assets/envelope/send/p4_c4_front.svg'),
    Flap: require('../../../../assets/envelope/send/p4_c4_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p4_c4_flap_back.svg'),
  },
  p4_c5: {
    Back: require('../../../../assets/envelope/send/p4_c5_back.svg'),
    Front: require('../../../../assets/envelope/send/p4_c5_front.svg'),
    Flap: require('../../../../assets/envelope/send/p4_c5_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p4_c5_flap_back.svg'),
  },
  p5_c1: {
    Back: require('../../../../assets/envelope/send/p5_c1_back.svg'),
    Front: require('../../../../assets/envelope/send/p5_c1_front.svg'),
    Flap: require('../../../../assets/envelope/send/p5_c1_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p5_c1_flap_back.svg'),
  },
  p5_c2: {
    Back: require('../../../../assets/envelope/send/p5_c2_back.svg'),
    Front: require('../../../../assets/envelope/send/p5_c2_front.svg'),
    Flap: require('../../../../assets/envelope/send/p5_c2_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p5_c2_flap_back.svg'),
  },
  p5_c3: {
    Back: require('../../../../assets/envelope/send/p5_c3_back.svg'),
    Front: require('../../../../assets/envelope/send/p5_c3_front.svg'),
    Flap: require('../../../../assets/envelope/send/p5_c3_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p5_c3_flap_back.svg'),
  },
  p5_c4: {
    Back: require('../../../../assets/envelope/send/p5_c4_back.svg'),
    Front: require('../../../../assets/envelope/send/p5_c4_front.svg'),
    Flap: require('../../../../assets/envelope/send/p5_c4_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p5_c4_flap_back.svg'),
  },
  p5_c5: {
    Back: require('../../../../assets/envelope/send/p5_c5_back.svg'),
    Front: require('../../../../assets/envelope/send/p5_c5_front.svg'),
    Flap: require('../../../../assets/envelope/send/p5_c5_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p5_c5_flap_back.svg'),
  },
  p5_c6: {
    Back: require('../../../../assets/envelope/send/p5_c6_back.svg'),
    Front: require('../../../../assets/envelope/send/p5_c6_front.svg'),
    Flap: require('../../../../assets/envelope/send/p5_c6_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p5_c6_flap_back.svg'),
  },
  p6_c1: {
    Back: require('../../../../assets/envelope/send/p6_c1_back.svg'),
    Front: require('../../../../assets/envelope/send/p6_c1_front.svg'),
    Flap: require('../../../../assets/envelope/send/p6_c1_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p6_c1_flap_back.svg'),
  },
  p6_c2: {
    Back: require('../../../../assets/envelope/send/p6_c2_back.svg'),
    Front: require('../../../../assets/envelope/send/p6_c2_front.svg'),
    Flap: require('../../../../assets/envelope/send/p6_c2_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p6_c2_flap_back.svg'),
  },
  p6_c3: {
    Back: require('../../../../assets/envelope/send/p6_c3_back.svg'),
    Front: require('../../../../assets/envelope/send/p6_c3_front.svg'),
    Flap: require('../../../../assets/envelope/send/p6_c3_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p6_c3_flap_back.svg'),
  },
  p6_c4: {
    Back: require('../../../../assets/envelope/send/p6_c4_back.svg'),
    Front: require('../../../../assets/envelope/send/p6_c4_front.svg'),
    Flap: require('../../../../assets/envelope/send/p6_c4_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p6_c4_flap_back.svg'),
  },
  p6_c5: {
    Back: require('../../../../assets/envelope/send/p6_c5_back.svg'),
    Front: require('../../../../assets/envelope/send/p6_c5_front.svg'),
    Flap: require('../../../../assets/envelope/send/p6_c5_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p6_c5_flap_back.svg'),
  },
  p7_c1: {
    Back: require('../../../../assets/envelope/send/p7_c1_back.svg'),
    Front: require('../../../../assets/envelope/send/p7_c1_front.svg'),
    Flap: require('../../../../assets/envelope/send/p7_c1_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p7_c1_flap_back.svg'),
  },
  p7_c2: {
    Back: require('../../../../assets/envelope/send/p7_c2_back.svg'),
    Front: require('../../../../assets/envelope/send/p7_c2_front.svg'),
    Flap: require('../../../../assets/envelope/send/p7_c2_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p7_c2_flap_back.svg'),
  },
  p7_c3: {
    Back: require('../../../../assets/envelope/send/p7_c3_back.svg'),
    Front: require('../../../../assets/envelope/send/p7_c3_front.svg'),
    Flap: require('../../../../assets/envelope/send/p7_c3_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p7_c3_flap_back.svg'),
  },
  p7_c4: {
    Back: require('../../../../assets/envelope/send/p7_c4_back.svg'),
    Front: require('../../../../assets/envelope/send/p7_c4_front.svg'),
    Flap: require('../../../../assets/envelope/send/p7_c4_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p7_c4_flap_back.svg'),
  },
  p7_c5: {
    Back: require('../../../../assets/envelope/send/p7_c5_back.svg'),
    Front: require('../../../../assets/envelope/send/p7_c5_front.svg'),
    Flap: require('../../../../assets/envelope/send/p7_c5_flap.svg'),
    FlapBack: require('../../../../assets/envelope/send/p7_c5_flap_back.svg'),
  },
};

/*
 * require('...svg') 결과는 ESM 상호운용에 따라 { default } 로 감싸질 수 있어
 * 렌더에 바로 쓸 수 있도록 컴포넌트만 꺼낸다 (envelopeUtils 의 toSvgComponent 와 같은 처리)
 */
const toSvgComponent = mod => mod?.default ?? mod ?? null;

const layerCache = {};

export const findSendEnvelopeLayers = colorId => {
  const sources = SEND_ENVELOPE_LAYER_SOURCES[colorId];

  if (!sources) {
    return null;
  }

  if (!layerCache[colorId]) {
    layerCache[colorId] = {
      Back: toSvgComponent(sources.Back),
      Front: toSvgComponent(sources.Front),
      Flap: toSvgComponent(sources.Flap),
      FlapBack: toSvgComponent(sources.FlapBack),
    };
  }

  return layerCache[colorId];
};
