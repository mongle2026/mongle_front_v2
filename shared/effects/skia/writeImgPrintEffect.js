import { Skia } from '@shopify/react-native-skia';

export const WRITE_IMG_PRINT_EFFECT =
  Skia.RuntimeEffect.Make(`
    uniform shader image;

    uniform float2 resolution;

    uniform float dotSize;
    uniform float dotScale;
    uniform float softness;
    uniform float rotation;

    uniform float grainSize;
    uniform float grainRadius;

    const float PI = 3.14159265359;

    float random(float2 point) {
      return fract(
        sin(
          dot(
            point,
            float2(127.1, 311.7)
          )
        ) * 43758.5453123
      );
    }

    float createNoise(float2 point) {
      float2 integerPoint = floor(point);
      float2 fractionPoint = fract(point);

      fractionPoint =
        fractionPoint *
        fractionPoint *
        (3.0 - 2.0 * fractionPoint);

      float bottomLeft =
        random(integerPoint);

      float bottomRight =
        random(
          integerPoint +
          float2(1.0, 0.0)
        );

      float topLeft =
        random(
          integerPoint +
          float2(0.0, 1.0)
        );

      float topRight =
        random(
          integerPoint +
          float2(1.0, 1.0)
        );

      return mix(
        mix(
          bottomLeft,
          bottomRight,
          fractionPoint.x
        ),
        mix(
          topLeft,
          topRight,
          fractionPoint.x
        ),
        fractionPoint.y
      );
    }

    float2 rotateAroundCenter(
      float2 point,
      float angle
    ) {
      float2 center = resolution * 0.5;
      float2 translatedPoint = point - center;

      float sine = sin(angle);
      float cosine = cos(angle);

      float2 rotatedPoint = float2(
        translatedPoint.x * cosine -
        translatedPoint.y * sine,

        translatedPoint.x * sine +
        translatedPoint.y * cosine
      );

      return rotatedPoint + center;
    }

    float createDot(
      float2 screenPosition,
      float inkAmount,
      float channelRotation
    ) {
      float safeDotSize =
        max(dotSize, 1.0);

      float rotationRadian =
        rotation * PI / 180.0;

      float2 rotatedPosition =
        rotateAroundCenter(
          screenPosition,
          channelRotation + rotationRadian
        );

      float2 cellPosition =
        fract(
          rotatedPosition / safeDotSize
        ) - 0.5;

      float distanceFromCenter =
        length(cellPosition);

      float radius =
        0.5 *
        sqrt(
          clamp(
            inkAmount,
            0.0,
            1.0
          )
        ) *
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
      float safeGrainSize =
        max(grainSize, 1.0);

      /*
       * Texture 효과입니다.
       * 두 개의 노이즈 값을 사용해
       * 이미지 좌표를 X, Y 방향으로 이동시킵니다.
       */
      float noiseX = createNoise(
        xy / safeGrainSize
      );

      float noiseY = createNoise(
        (
          xy +
          float2(73.1, 19.7)
        ) / safeGrainSize
      );

      float2 displacement =
        (
          float2(noiseX, noiseY) -
          0.5
        ) *
        2.0 *
        grainRadius;

      float2 effectedPosition = clamp(
        xy + displacement,
        float2(0.0, 0.0),
        resolution -
        float2(0.001, 0.001)
      );

      half4 sourceColor =
        image.eval(effectedPosition);

      float3 rgb = clamp(
        float3(sourceColor.rgb),
        0.0,
        1.0
      );

      /*
       * RGB를 CMYK 잉크 양으로 변환합니다.
       */
      float black =
        1.0 -
        max(
          rgb.r,
          max(rgb.g, rgb.b)
        );

      float denominator =
        max(
          1.0 - black,
          0.001
        );

      float cyan = clamp(
        (
          1.0 -
          rgb.r -
          black
        ) / denominator,
        0.0,
        1.0
      );

      float magenta = clamp(
        (
          1.0 -
          rgb.g -
          black
        ) / denominator,
        0.0,
        1.0
      );

      float yellow = clamp(
        (
          1.0 -
          rgb.b -
          black
        ) / denominator,
        0.0,
        1.0
      );

      /*
       * CMYK 채널별 기본 회전값입니다.
       * rotation uniform은 이 각도에 추가됩니다.
       */
      float cyanDot = createDot(
        effectedPosition,
        cyan,
        15.0 * PI / 180.0
      );

      float magentaDot = createDot(
        effectedPosition,
        magenta,
        75.0 * PI / 180.0
      );

      float yellowDot = createDot(
        effectedPosition,
        yellow,
        0.0
      );

      float blackDot = createDot(
        effectedPosition,
        black,
        45.0 * PI / 180.0
      );

      /*
       * 흰색 바탕에 CMYK 잉크를 겹치는
       * 감산 혼합 방식입니다.
       */
      float3 printColor = float3(
        1.0 - cyanDot,
        1.0 - magentaDot,
        1.0 - yellowDot
      );

      printColor *= 1.0 - blackDot;

      /*
       * Texture의 미세한 그레인 표현입니다.
       */
      float fineGrain = createNoise(
        (
          xy +
          float2(31.7, 57.3)
        ) /
        max(
          safeGrainSize * 0.22,
          1.0
        )
      );

      float grainStrength =
        min(
          grainRadius * 0.015,
          0.08
        );

      printColor = clamp(
        printColor +
        (
          fineGrain - 0.5
        ) *
        grainStrength,
        0.0,
        1.0
      );

      /*
       * Clip to alpha off 조건에 따라
       * 원본 알파값을 사용하지 않고 불투명하게 처리합니다.
       */
      return half4(
        half3(printColor),
        1.0
      );
    }
  `);

if (!WRITE_IMG_PRINT_EFFECT) {
  throw new Error(
    'WriteImg 프린트 효과 컴파일에 실패했습니다.'
  );
}