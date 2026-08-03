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

    /*
     * 하프톤의 시각적 강도를 조절하는 값입니다.
     * 디자인팀의 dotSize, dotScale 등의 조건과는 별개입니다.
     */
    const float PRINT_GAMMA = 1.55;
    const float PRINT_GAIN = 0.46;
    const float COLOR_SEPARATION = 0.12;
    // 낮추면 낮출 수록 은은해짐 
    const float EFFECT_MIX = 0.05;

    /*
     * Texture가 잉크 농도에 미치는 최대 강도입니다.
     * 원본 픽셀 위치는 움직이지 않습니다.
     */
    const float TEXTURE_STRENGTH = 0.045;

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
      float2 integerPoint =
        floor(point);

      float2 fractionPoint =
        fract(point);

      fractionPoint =
        fractionPoint *
        fractionPoint *
        (
          3.0 -
          2.0 * fractionPoint
        );

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
      float2 center =
        resolution * 0.5;

      float2 translatedPoint =
        point - center;

      float sine =
        sin(angle);

      float cosine =
        cos(angle);

      float2 rotatedPoint =
        float2(
          translatedPoint.x * cosine -
          translatedPoint.y * sine,

          translatedPoint.x * sine +
          translatedPoint.y * cosine
        );

      return rotatedPoint + center;
    }

    float mapPrintValue(
      float value
    ) {
      float safeValue =
        clamp(
          value,
          0.0,
          1.0
        );

      return clamp(
        pow(
          safeValue,
          PRINT_GAMMA
        ) * PRINT_GAIN,
        0.0,
        1.0
      );
    }

    float createDot(
      float2 screenPosition,
      float amount,
      float channelRotation
    ) {
      float safeDotSize =
        max(
          dotSize,
          1.0
        );

      float rotationRadian =
        rotation *
        PI /
        180.0;

      float2 rotatedPosition =
        rotateAroundCenter(
          screenPosition,
          channelRotation +
          rotationRadian
        );

      float2 cellPosition =
        fract(
          rotatedPosition /
          safeDotSize
        ) - 0.5;

      float distanceFromCenter =
        length(cellPosition);

      float radius =
        0.5 *
        sqrt(
          clamp(
            amount,
            0.0,
            1.0
          )
        ) *
        dotScale;

      float edge =
        max(
          softness /
          safeDotSize,
          0.001
        );

      return 1.0 -
        smoothstep(
          radius - edge,
          radius + edge,
          distanceFromCenter
        );
    }

    half4 main(float2 xy) {
      float safeGrainSize =
        max(
          grainSize,
          1.0
        );

      /*
       * 중요:
       * 원본 이미지를 반드시 원래 좌표 xy에서 읽습니다.
       *
       * 이전처럼 xy + displacement로 읽으면
       * 나무, 건물, 인물 등의 형태 자체가 휘어집니다.
       */
      half4 sourceColor =
        image.eval(xy);

      float3 sourceRgb =
        clamp(
          float3(
            sourceColor.rgb
          ),
          0.0,
          1.0
        );

      /*
       * Texture size는 노이즈의 반복 주기로 사용합니다.
       */
      float textureNoise =
        createNoise(
          xy /
          safeGrainSize
        );

      float secondaryTextureNoise =
        createNoise(
          (
            xy +
            float2(73.1, 19.7)
          ) /
          safeGrainSize
        );

      /*
       * -1부터 1 사이의 Texture 신호입니다.
       */
      float textureSignal =
        (
          (
            textureNoise +
            secondaryTextureNoise
          ) *
          0.5 -
          0.5
        ) *
        2.0;

      /*
       * grainRadius는 Texture의 영향 강도로 사용합니다.
       * 디자인팀의 radius 4일 때 기본 강도가 적용됩니다.
       *
       * 단, 이미지 좌표는 이동시키지 않으므로
       * 사진의 형태가 꾸겨지지 않습니다.
       */
      float textureAmount =
        textureSignal *
        TEXTURE_STRENGTH *
        clamp(
          grainRadius / 4.0,
          0.0,
          2.0
        );

      float maximumChannel =
        max(
          sourceRgb.r,
          max(
            sourceRgb.g,
            sourceRgb.b
          )
        );

      float3 normalizedColor =
        sourceRgb /
        max(
          maximumChannel,
          0.001
        );

      /*
       * Texture는 도트의 농도에만 적용합니다.
       */
      float neutralAmount =
        clamp(
          mapPrintValue(
            maximumChannel
          ) +
          textureAmount,
          0.0,
          1.0
        );

      float3 channelAmount =
        clamp(
          float3(
            mapPrintValue(
              sourceRgb.r
            ),
            mapPrintValue(
              sourceRgb.g
            ),
            mapPrintValue(
              sourceRgb.b
            )
          ) +
          float3(
            textureAmount
          ),
          0.0,
          1.0
        );

      /*
       * CMYK 채널별 스크린 각도입니다.
       * rotation uniform 값은 각 채널의 각도에 추가됩니다.
       */
      float redDot =
        createDot(
          xy,
          channelAmount.r,
          15.0 *
          PI /
          180.0
        );

      float greenDot =
        createDot(
          xy,
          channelAmount.g,
          75.0 *
          PI /
          180.0
        );

      float blueDot =
        createDot(
          xy,
          channelAmount.b,
          0.0
        );

      float neutralDot =
        createDot(
          xy,
          neutralAmount,
          45.0 *
          PI /
          180.0
        );

      float3 neutralScreen =
        normalizedColor *
        neutralDot;

      float3 separatedScreen =
        float3(
          redDot,
          greenDot,
          blueDot
        );

      float3 printColor =
        mix(
          neutralScreen,
          separatedScreen,
          COLOR_SEPARATION
        );

      printColor =
        clamp(
          printColor,
          0.0,
          1.0
        );

      /*
       * 원본과 하프톤 결과를 은은하게 합성합니다.
       */
      float3 finalColor =
        mix(
          sourceRgb,
          printColor,
          EFFECT_MIX
        );

      return half4(
        half3(
          clamp(
            finalColor,
            0.0,
            1.0
          )
        ),
        1.0
      );
    }
  `);

if (!WRITE_IMG_PRINT_EFFECT) {
  throw new Error(
    'WriteImg 프린트 효과 컴파일에 실패했습니다.'
  );
}