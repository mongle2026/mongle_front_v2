import { Skia } from '@shopify/react-native-skia';

/*
 * 피드 사진용 필름카메라 보정입니다. (노출 과다 + 플래시 필름 느낌)
 * 원본 파일은 건드리지 않고 그릴 때만 적용하므로
 * 같은 사진은 언제 다시 열어도 같은 결과로 보입니다.
 * (그레인도 시간값 없이 좌표로만 만들어서 매번 같은 패턴입니다)
 *
 * 톤 기준: 하이라이트는 복숭아빛으로 하얗게 날아가며 붉게 번지고,
 * 검정은 살짝 뜬 올리브빛, 피부·입술 같은 따뜻한 색은 진하게.
 * 노랗게 뜨지 않도록 하이라이트에서 파랑을 빼지 않고 빨강을 더합니다.
 */
export const WRITE_IMG_FILM_EFFECT =
  Skia.RuntimeEffect.Make(`
    uniform shader image;

    uniform float2 resolution;

    /*
     * 사진별 배율 (measureImageTone.js 에서 계산, 둘 다 1 이면 필터 그대로)
     * saturationScale: 원래 진한 사진일수록 작아져서 채도를 더 낮춥니다.
     * exposureScale  : 원래 밝은 사진일수록 작아져서 노출을 덜 올립니다.
     */
    uniform float saturationScale;
    uniform float exposureScale;

    const float3 LUMA = float3(0.299, 0.587, 0.114);

    /*
     * 선명도: 주변 픽셀을 섞어 디지털 특유의 또렷함을 살짝 줄입니다.
     * SOFTEN_RADIUS 는 dp 단위, 키울수록 더 뭉개집니다.
     */
    const float SOFTEN_RADIUS = 0.5;
    const float SOFTEN_MIX = 0.3;

    // 렌즈 색 번짐. R은 오른쪽, B는 왼쪽에서 살짝 읽습니다.
    const float CHROMA_SHIFT = 0.6;

    /*
     * 노출: 1.0 보다 크면 전체가 밝아집니다.
     * WHITE_POINT 위는 흰색으로 날립니다. 낮출수록 더 많이 날아갑니다.
     */
    const float EXPOSURE = 1.14;
    const float WHITE_POINT = 0.87;
    const float BLACK_LIFT = 0.08;
    const float CONTRAST_MIX = 0.2;

    // 채도. 1.0 이 원본. 실제로는 여기에 사진별 saturationScale 을 곱합니다.
    const float SATURATION = 1.0;

    /*
     * 스플릿 톤: 그림자는 올리브, 하이라이트는 복숭아·핑크
     */
    const float3 SHADOW_TINT = float3(-0.012, 0.018, -0.006);
    const float3 HIGHLIGHT_TINT = float3(0.03, -0.004, -0.004);

    /*
     * 할레이션: 밝은 부분 주변으로 붉은 빛이 번집니다.
     */
    const float HALATION_RADIUS = 2.2;
    const float HALATION_STRENGTH = 0.14;
    const float3 HALATION_COLOR = float3(1.0, 0.45, 0.35);

    /*
     * 그레인. 크기는 dp 단위 (0.4dp ≒ iPhone 에서 1px 남짓)
     * 굵기가 다른 두 겹을 섞어 균일한 디지털 노이즈처럼 보이지 않게 합니다.
     */
    const float GRAIN_SIZE = 0.4;
    const float GRAIN_STRENGTH = 0.05;

    // 비네트. 가장자리가 어두워지는 최대 비율
    const float VIGNETTE_STRENGTH = 0.1;

    float random(float2 point) {
      return fract(
        sin(dot(point, float2(127.1, 311.7))) * 43758.5453123
      );
    }

    // 부드럽게 이어지는 노이즈 (0 ~ 1)
    float createNoise(float2 point) {
      float2 integerPoint = floor(point);
      float2 fractionPoint = fract(point);

      fractionPoint =
        fractionPoint * fractionPoint * (3.0 - 2.0 * fractionPoint);

      float bottomLeft = random(integerPoint);
      float bottomRight = random(integerPoint + float2(1.0, 0.0));
      float topLeft = random(integerPoint + float2(0.0, 1.0));
      float topRight = random(integerPoint + float2(1.0, 1.0));

      return mix(
        mix(bottomLeft, bottomRight, fractionPoint.x),
        mix(topLeft, topRight, fractionPoint.x),
        fractionPoint.y
      );
    }

    float3 sampleRgb(float2 point) {
      return clamp(float3(image.eval(point).rgb), 0.0, 1.0);
    }

    half4 main(float2 xy) {
      /*
       * 1. 살짝 부드럽게 + 색 번짐
       */
      float3 centerRgb = sampleRgb(xy);

      float3 blurredRgb = (
        centerRgb * 2.0 +
        sampleRgb(xy + float2(SOFTEN_RADIUS, 0.0)) +
        sampleRgb(xy - float2(SOFTEN_RADIUS, 0.0)) +
        sampleRgb(xy + float2(0.0, SOFTEN_RADIUS)) +
        sampleRgb(xy - float2(0.0, SOFTEN_RADIUS))
      ) / 6.0;

      float3 color = mix(centerRgb, blurredRgb, SOFTEN_MIX);

      color.r = mix(color.r, sampleRgb(xy + float2(CHROMA_SHIFT, 0.0)).r, 0.5);
      color.b = mix(color.b, sampleRgb(xy - float2(CHROMA_SHIFT, 0.0)).b, 0.5);

      /*
       * 2. 할레이션: 주변 밝은 부분을 모아 붉은 빛으로 더합니다.
       */
      float glow = (
        dot(sampleRgb(xy + float2(HALATION_RADIUS, HALATION_RADIUS)), LUMA) +
        dot(sampleRgb(xy + float2(-HALATION_RADIUS, HALATION_RADIUS)), LUMA) +
        dot(sampleRgb(xy + float2(HALATION_RADIUS, -HALATION_RADIUS)), LUMA) +
        dot(sampleRgb(xy + float2(-HALATION_RADIUS, -HALATION_RADIUS)), LUMA)
      ) / 4.0;

      color += HALATION_COLOR * smoothstep(0.6, 0.95, glow) * HALATION_STRENGTH;

      /*
       * 3. 채도 → 노출 과다 → 대비 → 검정 띄우기
       */
      float luma = dot(color, LUMA);

      color = clamp(
        mix(float3(luma), color, SATURATION * saturationScale),
        0.0,
        1.0
      );
      color = clamp(
        color * EXPOSURE * exposureScale / WHITE_POINT,
        0.0,
        1.0
      );
      color = mix(color, smoothstep(0.0, 1.0, color), CONTRAST_MIX);
      color = BLACK_LIFT + color * (1.0 - BLACK_LIFT);

      /*
       * 4. 스플릿 톤
       */
      luma = dot(color, LUMA);

      float shadowWeight = 1.0 - smoothstep(0.05, 0.5, luma);
      float highlightWeight = smoothstep(0.5, 0.95, luma);

      color += SHADOW_TINT * shadowWeight;
      color += HIGHLIGHT_TINT * highlightWeight;

      /*
       * 5. 비네트: 가장자리를 은은하게 누릅니다 (색은 바꾸지 않음)
       */
      float2 safeResolution = max(resolution, float2(1.0));
      float2 fromCenter = xy / safeResolution - 0.5;

      // 중앙 0, 모서리 1
      float edgeDistance = length(fromCenter) * 1.4142;

      color *= 1.0 - smoothstep(0.5, 1.1, edgeDistance) * VIGNETTE_STRENGTH;

      /*
       * 6. 그레인: 중간 밝기에서 가장 잘 보이게 합니다.
       */
      float2 grainPoint = xy / GRAIN_SIZE;

      float grain =
        createNoise(grainPoint) * 0.65 +
        createNoise(grainPoint * 0.5 + float2(17.3, 41.9)) * 0.35 -
        0.5;

      float grainMask = 1.0 - abs(luma * 2.0 - 1.0) * 0.5;

      color += grain * GRAIN_STRENGTH * grainMask;

      return half4(half3(clamp(color, 0.0, 1.0)), 1.0);
    }
  `);

/*
 * 컴파일에 실패해도 앱이 멈추지 않도록 null 로 두고,
 * WriteImgEffectRenderer 에서 보정 없이 원본을 그립니다.
 */
if (!WRITE_IMG_FILM_EFFECT) {
  console.warn('WriteImg 필름 효과 컴파일에 실패했습니다.');
}
