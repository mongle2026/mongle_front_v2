import { Skia } from '@shopify/react-native-skia';

export const MUSIC_COVER_HALFTONE_EFFECT =
  Skia.RuntimeEffect.Make(`
    uniform shader image;

    uniform float dotSize;
    uniform float dotScale;
    uniform float softness;

    const float PI = 3.14159265359;

    float2 rotatePoint(
      float2 point,
      float angle
    ) {
      float sine = sin(angle);
      float cosine = cos(angle);

      return float2(
        point.x * cosine - point.y * sine,
        point.x * sine + point.y * cosine
      );
    }

    float3 normalizeBrightness(float3 rgb) {
      float luminance = dot(
        rgb,
        float3(0.2126, 0.7152, 0.0722)
      );

      if (luminance <= 0.0001) {
        return float3(0.0);
      }

      /*
       * 별도의 brightness prop 없이 이미지 밝기를
       * 셰이더 내부에서 자동으로 정규화합니다.
       */
      float normalizedLuminance = smoothstep(
        0.04,
        0.96,
        luminance
      );

      float brightnessScale =
        normalizedLuminance / luminance;

      return clamp(
        rgb * brightnessScale,
        0.0,
        1.0
      );
    }

    float createDot(
      float2 screenPosition,
      float inkAmount,
      float angle
    ) {
      float safeDotSize = max(dotSize, 1.0);

      /*
       * 이미지 UV가 아닌 화면 좌표를 회전시킵니다.
       * 이미지가 확대되더라도 그리드는 화면 기준으로 유지됩니다.
       */
      float2 rotatedPosition = rotatePoint(
        screenPosition,
        angle
      );

      float2 cellPosition =
        fract(rotatedPosition / safeDotSize) - 0.5;

      float distanceFromCenter =
        length(cellPosition);

      /*
       * 잉크 양에 비례해 도트 면적이 증가하도록
       * sqrt를 적용합니다.
       */
      float radius =
        0.5 *
        sqrt(clamp(inkAmount, 0.0, 1.0)) *
        dotScale;

      float edge =
        max(
          softness / safeDotSize,
          0.001
        );

      return 1.0 - smoothstep(
        radius - edge,
        radius + edge,
        distanceFromCenter
      );
    }

    half4 main(float2 xy) {
      half4 sourceColor = image.eval(xy);

      float3 rgb = normalizeBrightness(
        clamp(
          float3(sourceColor.rgb),
          0.0,
          1.0
        )
      );

      /*
       * RGB를 CMYK 잉크 양으로 변환합니다.
       */
      float black =
        1.0 - max(
          rgb.r,
          max(rgb.g, rgb.b)
        );

      float denominator =
        max(1.0 - black, 0.001);

      float cyan = clamp(
        (1.0 - rgb.r - black) / denominator,
        0.0,
        1.0
      );

      float magenta = clamp(
        (1.0 - rgb.g - black) / denominator,
        0.0,
        1.0
      );

      float yellow = clamp(
        (1.0 - rgb.b - black) / denominator,
        0.0,
        1.0
      );

      /*
       * CMYK 채널별 망점 각도입니다.
       * 전체 그리드 계산은 모두 화면 좌표 xy를 기준으로 합니다.
       */
      float cyanDot = createDot(
        xy,
        cyan,
        15.0 * PI / 180.0
      );

      float magentaDot = createDot(
        xy,
        magenta,
        75.0 * PI / 180.0
      );

      float yellowDot = createDot(
        xy,
        yellow,
        0.0
      );

      float blackDot = createDot(
        xy,
        black,
        45.0 * PI / 180.0
      );

      /*
       * 흰 종이 위에 CMYK 잉크를 겹치는 감산 혼합입니다.
       */
      float3 halftoneColor = float3(
        1.0 - cyanDot,
        1.0 - magentaDot,
        1.0 - yellowDot
      );

      halftoneColor *= 1.0 - blackDot;

      return half4(
        half3(
          clamp(
            halftoneColor,
            0.0,
            1.0
          )
        ),
        sourceColor.a
      );
    }
  `);

if (!MUSIC_COVER_HALFTONE_EFFECT) {
  throw new Error(
    'MusicCoverImg 하프톤 셰이더 컴파일에 실패했습니다.'
  );
}